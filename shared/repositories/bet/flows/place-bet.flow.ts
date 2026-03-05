import { Result, ok, err, ResultAsync, okAsync, errAsync } from 'neverthrow';
import * as Crypto from 'expo-crypto';
import { BetDomainModel, BetRepositoryResult } from '../bet.types';
import { IBetStorage, IBetApi } from '../bet.ports';
import { BetLogic } from '../bet.logic';
import { offlineEventBus } from '@/shared/core/offline-storage/instance';
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
const validateBusinessRules = async (
    betData: Omit<BetDomainModel, 'externalId' | 'status' | 'timestamp'>,
    storage: IBetStorage
): Promise<Result<Omit<BetDomainModel, 'externalId' | 'status' | 'timestamp'>, Error>> => {
    const allBets = await storage.getAll();
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
const prepareAndSaveBet = async (
    betData: Omit<BetDomainModel, 'externalId' | 'status' | 'timestamp'>,
    storage: IBetStorage
): Promise<Result<BetDomainModel, Error>> => {
    const trustedNow = await TimerRepository.getTrustedNow(Date.now());
    const bet: BetDomainModel = {
        ...betData,
        externalId: Crypto.randomUUID(),
        status: 'pending',
        timestamp: trustedNow
    };

    await storage.save(bet);
    return ok(bet);
};

/**
 * 3. Notify bet creation for reactivity.
 */
const notifyBetCreated = async (
    bet: BetDomainModel
): Promise<Result<BetDomainModel, Error>> => {
    try {
        const trustedNow = await TimerRepository.getTrustedNow(Date.now());
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
        return ok(bet);
    } catch (error) {
        log.error('Error notifying bet creation', error);
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
        await storage.updateStatus(bet.externalId, 'error', {
            lastError: String(error)
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
    // Functional Builder orchestration using ResultAsync (neverthrow)
    return okAsync(betData)
        .andThen(data => new ResultAsync(validateBusinessRules(data, storage)))
        .andThen(data => new ResultAsync(prepareAndSaveBet(data, storage)))
        .andThen(bet => new ResultAsync(notifyBetCreated(bet)))
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
    return okAsync(betsData)
        .andThen(dataList => {
            const validations = dataList.map(data => new ResultAsync(validateBusinessRules(data, storage)));
            return ResultAsync.combine(validations);
        })
        .andThen(validList => {
            const preparations = validList.map(data => new ResultAsync(prepareAndSaveBet(data, storage)));
            return ResultAsync.combine(preparations);
        })
        .andThen(savedList => {
            const notifications = savedList.map(bet => new ResultAsync(notifyBetCreated(bet)));
            return ResultAsync.combine(notifications);
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
