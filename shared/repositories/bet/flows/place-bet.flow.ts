import { Result, ok, err, ResultAsync, okAsync, errAsync } from 'neverthrow';
import * as Crypto from 'expo-crypto';
import { BetDomainModel, BetRepositoryResult } from '../bet.types';
import { IBetStorage, IBetApi } from '../bet.ports';
import { BetLogic } from '../bet.logic';
import { offlineEventBus } from '@core/offline-storage/instance';
import { drawRepository } from '../../draw';
import { financialRepository, FinancialKeys } from '../../financial';
import { GameType, BetType } from '@/types';
import { isServerReachable } from '@/shared/utils/network';
import { mapBackendBetToFrontend, mapSinglePendingBetToFrontend } from '@/shared/services/bet/mapper';
import { logger } from '@/shared/utils/logger';
import { TimerRepository } from '@/shared/repositories/system/time';

const log = logger.withTag('PlaceBetFlow');

/**
 * 1. Validate business rules.
 */
const validateBusinessRules = (
    betData: Omit<BetDomainModel, 'externalId' | 'status' | 'timestamp'>,
    allBets: BetDomainModel[],
    clientNow: number
): Result<Omit<BetDomainModel, 'externalId' | 'status' | 'timestamp'>, Error> => {
    // 1. Integridad de Tiempo (CA-03)
    const integrity = TimerRepository.validateIntegrity(clientNow);
    if (integrity.status !== 'ok') {
        const errorMsg = integrity.status === 'backward'
            ? 'FRAUDE_TIEMPO: Se detectó un retroceso en el reloj del dispositivo.'
            : 'FRAUDE_TIEMPO: Se detectó un salto inusual en el reloj del dispositivo.';
        return err(new Error(errorMsg));
    }

    // 2. Bloqueo por Sincronización Pendiente
    const { blocked } = BetLogic.isAppBlocked(allBets);
    if (blocked) return err(new Error('APUESTA_BLOQUEADA: Debes sincronizar antes de continuar.'));

    // 3. Monto y Estructura
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

        const status = (error as any)?.status ?? (error as any)?.response?.status;
        const isFatal = status >= 400 && status < 500 && status !== 401 && status !== 403;

        await storage.updateStatus(bet.externalId, isFatal ? 'blocked' : 'pending', {
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

const attemptBatchSyncIfOnline = async (
    bets: BetDomainModel[],
    api: IBetApi,
    storage: IBetStorage
): Promise<void> => {
    try {
        const online = await isServerReachable();
        if (!online) return;

        for (const bet of bets) {
            await attemptSync(bet, api, storage);
        }
    } catch (error) {
        log.warn('Batch immediate sync failed, keeping bets pending', error);
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
    const clientNow = Date.now();
    const trustedNow = TimerRepository.getTrustedNow(clientNow);

    // Functional Builder orchestration using ResultAsync (neverthrow)
    return okAsync(betWithCode)
        .andThen(data => {
            const validationResult = validateBusinessRules(data, allBets, clientNow);
            return validationResult.isOk() ? okAsync(validationResult.value) : errAsync(validationResult.error);
        })
        .andThen(data => {
            const bet = prepareBet(data, trustedNow);
            return ResultAsync.fromPromise(storage.save(bet).then(() => bet), e => e as Error);
        })
        .andThen(bet => {
            // Registrar transacción financiera (Crédito)
            const origin = FinancialKeys.forBet(
                String(bet.ownerStructure || ''),
                String(bet.drawId || ''),
                bet.externalId || ''
            );

            return ResultAsync.fromPromise(
                (async () => {
                    try {
                        await financialRepository.addCredit(
                            origin,
                            Number(bet.amount),
                            trustedNow,
                            { betId: bet.externalId, receiptCode: bet.receiptCode }
                        );
                    } catch (error) {
                        log.error('Error recording financial transaction', error);
                    }
                    return bet;
                })(),
                e => e as Error
            );
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
    const clientNow = Date.now();
    const trustedNow = TimerRepository.getTrustedNow(clientNow);

    return okAsync(betsWithCommonCode)
        .andThen(dataList => {
            // Validación en memoria (Ultra-rápida)
            const validations = dataList.map(data => validateBusinessRules(data, allBets, clientNow));
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
            // Registrar transacciones financieras en lote
            const financialTransactions = savedList.map(bet => ({
                origin: FinancialKeys.forBet(
                    String(bet.ownerStructure || ''),
                    String(bet.drawId || ''),
                    bet.externalId || ''
                ),
                amount: Number(bet.amount),
                type: 'credit' as const,
                metadata: { betId: bet.externalId, receiptCode: bet.receiptCode }
            }));

            return ResultAsync.fromPromise(
                (async () => {
                    try {
                        await financialRepository.addTransactions(financialTransactions, trustedNow);
                    } catch (error) {
                        log.error('Error recording financial batch transactions', error);
                    }
                    return savedList;
                })(),
                e => e as Error
            );
        })
        .andThen(savedList => {
            // Notificación reactiva
            notifyBatchCreated(savedList, trustedNow);
            return ResultAsync.fromPromise(
                attemptBatchSyncIfOnline(savedList, api, storage).then(() => savedList),
                e => e as Error
            );
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
