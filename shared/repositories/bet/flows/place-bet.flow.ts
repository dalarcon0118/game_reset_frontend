import { Result, ok, err, ResultAsync, okAsync, errAsync } from 'neverthrow';
import * as Crypto from 'expo-crypto';
import { BetDomainModel, BetRepositoryResult } from '../bet.types';
import { IBetStorage, IBetApi } from '../bet.ports';
import { BetLogic } from '../bet.logic';
import { offlineEventBus } from '@core/offline-storage/instance';
import { drawRepository } from '../../draw';
import { GameType, BetType } from '@/types';
import { isServerReachable } from '@/shared/utils/network';
import { mapBackendBetToFrontend, mapSinglePendingBetToFrontend } from '@/shared/services/bet/mapper';
import { logger } from '@/shared/utils/logger';
import { TimerRepository } from '../../system/time/timer.repository';

const log = logger.withTag('PlaceBetFlow');

/**
 * 1. Validate business rules.
 */
const validateBusinessRules = (
    betData: Omit<BetDomainModel, 'externalId' | 'status' | 'timestamp'>,
    allBets: BetDomainModel[]
): Result<Omit<BetDomainModel, 'externalId' | 'status' | 'timestamp'>, Error> => {
    const { blocked } = BetLogic.isAppBlocked(allBets);
    if (blocked) return err(new Error('APUESTA_BLOQUEADA: Debes sincronizar antes de continuar.'));

    const amount = Number(betData.amount) || 0;
    if (amount <= 0) return err(new Error(`ERROR_CRITICO: Monto inválido (${betData.amount})`));

    if (!betData.ownerStructure) return err(new Error('ERROR_CRITICO: ownerStructure es obligatorio'));

    return ok(betData);
};

/**
 * 2. Prepare and save bet locally.
 */
const prepareBet = (
    betData: Omit<BetDomainModel, 'externalId' | 'status' | 'timestamp'>,
    trustedNow: number
): BetDomainModel => {
    return {
        ...betData,
        externalId: Crypto.randomUUID(),
        status: 'pending',
        timestamp: trustedNow
    };
};

/**
 * 3. Notify bet creation for reactivity.
 */
const notifyBatchCreated = (
    bets: BetDomainModel[],
    trustedNow: number
): Result<void, Error> => {
    try {
        bets.forEach(bet => {
            offlineEventBus.publish({
                type: 'SYNC_ITEM_SUCCESS',
                entity: 'bet',
                payload: {
                    id: bet.externalId,
                    drawId: bet.drawId,
                    changeType: 'local_added'
                },
                timestamp: trustedNow
            });
        });
        return ok(undefined);
    } catch (error) {
        log.error('Error notifying batch creation', error);
        return err(error instanceof Error ? error : new Error(String(error)));
    }
};


/**
 * 4. Attempt to sync with backend.
 */
const attemptSync = async (
    bet: BetDomainModel,
    api: IBetApi,
    storage: IBetStorage
): Promise<Result<{ bet: BetDomainModel; synced: boolean; result?: BetRepositoryResult }, Error>> => {
    try {
        if (await isServerReachable()) {
            const response = await api.create(bet as any, bet.externalId);
            const backendBets = Array.isArray(response) ? response : [response];

            const result = await drawRepository.getBetTypes(String(bet.drawId || ''));
            const betTypes: GameType[] = result.isOk()
                ? result.value.map((t): GameType => ({
                    id: String(t.id),
                    name: t.name,
                    code: t.code || '',
                    description: t.description || ''
                }))
                : [];

            const mappedBets = backendBets.map(b => mapBackendBetToFrontend(b, betTypes));

            await storage.updateStatus(bet.externalId, 'synced', {
                backendBets: mappedBets
            });

            return ok({
                bet,
                synced: true,
                result: mappedBets.length === 1 ? mappedBets[0] : mappedBets
            });
        }

        // Offline: just return the bet
        return ok({ bet, synced: false });
    } catch (error) {
        log.warn('Sync failed, bet remains pending', error);

        const isFatal = (error as any).status >= 400 && (error as any).status < 500;

        await storage.updateStatus(bet.externalId, isFatal ? 'error' : 'pending', {
            syncContext: {
                lastAttempt: Date.now(),
                attemptsCount: 1,
                lastError: error instanceof Error ? error.message : String(error),
                errorType: isFatal ? 'FATAL' : 'RETRYABLE'
            }
        });
        return ok({ bet, synced: false });
    }
};

/**
 * 5. Map final result for UI.
 */
const mapToResult = async (
    syncResult: { bet: BetDomainModel; synced: boolean; result?: BetRepositoryResult }
): Promise<Result<BetRepositoryResult, Error>> => {
    if (syncResult.synced && syncResult.result) {
        return ok(syncResult.result);
    }

    const result = await drawRepository.getBetTypes(String(syncResult.bet.drawId || ''));
    const betTypes: GameType[] = result.isOk()
        ? result.value.map((t): GameType => ({
            id: String(t.id),
            name: t.name,
            code: t.code || '',
            description: t.description || ''
        }))
        : [];

    return ok(mapSinglePendingBetToFrontend(syncResult.bet as any, betTypes));
};

/**
 * Flow for placing a single bet.
 * Orchestrates steps using functional decomposition.
 */
export const placeBetFlow = async (
    betData: Omit<BetDomainModel, 'externalId' | 'status' | 'timestamp'>,
    storage: IBetStorage,
    api: IBetApi
): Promise<Result<BetRepositoryResult, Error>> => {
    // Asegurar receiptCode único si no viene ya uno
    const betWithCode = {
        ...betData,
        receiptCode: betData.receiptCode || BetLogic.generateReceiptCode()
    };

    const allBets = await storage.getAll();
    const trustedNow = await TimerRepository.getTrustedNow(Date.now());

    // Functional Builder orchestration using ResultAsync (neverthrow)
    return okAsync(betWithCode)
        .andThen(data => ResultAsync.fromPromise(Promise.resolve(validateBusinessRules(data, allBets)), e => e as Error))
        .andThen(data => {
            const bet = prepareBet(data, trustedNow);
            return ResultAsync.fromPromise(storage.save(bet).then(() => bet), e => e as Error);
        })
        .andThen(bet => {
            notifyBatchCreated([bet], trustedNow);
            return okAsync(bet);
        })
        .andThen(bet => new ResultAsync(attemptSync(bet, api, storage)))
        .andThen(syncResult => new ResultAsync(mapToResult(syncResult)));
};

/**
 * Flow for placing a batch of bets.
 */
export const placeBatchFlow = async (
    betsData: Omit<BetDomainModel, 'externalId' | 'status' | 'timestamp'>[],
    storage: IBetStorage,
    api: IBetApi
): Promise<Result<BetType[], Error>> => {
    // Generar un único receiptCode para todo el batch si no viene ya uno
    const commonReceiptCode = BetLogic.generateReceiptCode();
    const betsWithCommonCode = betsData.map(bet => ({
        ...bet,
        receiptCode: bet.receiptCode || commonReceiptCode
    }));

    // Cargar contexto UNA SOLA VEZ para evitar O(N^2) y redundancia de I/O
    const allBets = await storage.getAll();
    const trustedNow = await TimerRepository.getTrustedNow(Date.now());

    return okAsync(betsWithCommonCode)
        .andThen(dataList => {
            // Validación en memoria (Ultra-rápida)
            const validations = dataList.map(data => validateBusinessRules(data, allBets));
            const combined = Result.combine(validations);
            return combined.isOk() ? okAsync(combined.value) : errAsync(combined.error);
        })
        .andThen(validList => {
            // Preparación en memoria
            const preparedBets = validList.map(data => prepareBet(data, trustedNow));
            // Guardado en lote (Una sola operación de I/O)
            return ResultAsync.fromPromise(
                storage.saveBatch(preparedBets).then(() => preparedBets),
                e => e as Error
            );
        })
        .andThen(savedList => {
            // Notificación reactiva
            notifyBatchCreated(savedList, trustedNow);
            return okAsync(savedList);
        })
        .andThen(savedList => {
            return new ResultAsync((async () => {
                const drawId = savedList[0]?.drawId;
                const betTypesResult = await drawRepository.getBetTypes(String(drawId || ''));
                const betTypes: GameType[] = betTypesResult.isOk()
                    ? betTypesResult.value.map((t): GameType => ({
                        id: String(t.id),
                        name: t.name,
                        code: t.code || '',
                        description: t.description || ''
                    }))
                    : [];

                const mappedPending = savedList.map(bet =>
                    mapSinglePendingBetToFrontend(bet as any, betTypes)
                );
                return ok(mappedPending as BetType[]);
            })());
        });
};
