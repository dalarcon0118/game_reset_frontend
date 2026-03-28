import { Result, ok, err } from 'neverthrow';
import { IBetStorage, IBetApi } from '../bet.ports';
import { drawRepository } from '../../draw';
import { GameType } from '@/types';
import { mapBackendBetToFrontend } from '@/shared/services/bet/mapper';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('SyncBetsFlow');

/**
 * Step function to sync a single bet.
 * Uses a pipeline internally for consistency.
 */
const syncSingleBet = async (
    bet: any,
    storage: IBetStorage,
    api: IBetApi
): Promise<Result<void, Error>> => {
    const amount = Number(bet.amount) || 0;
    const structureId = bet.ownerStructure;
    if (amount <= 0 || !structureId) {
        return err(new Error(`ERROR_CRITICO_SYNC: Datos inválidos en apuesta ${bet.externalId}`));
    }

    try {
        log.info(`Syncing bet ${bet.externalId} with backend...`);
        const response = await api.create(bet as any, bet.externalId);
        const backendBets = Array.isArray(response) ? response : [response];

        const betTypesResult = await drawRepository.getBetTypes(String(bet.drawId || ''));
        const betTypes: GameType[] = betTypesResult.isOk()
            ? betTypesResult.value.map((t): GameType => ({
                id: String(t.id),
                name: t.name,
                code: t.code || '',
                description: t.description || ''
            }))
            : [];

        const mappedBets = backendBets.map(b => mapBackendBetToFrontend(b, betTypes));
        await storage.updateStatus(bet.externalId, 'synced', { backendBets: mappedBets });
        return ok<void, Error>(undefined);
    } catch (error) {
        log.error(`Failed to sync bet ${bet.externalId}`, error);

        const attemptsCount = (bet.syncContext?.attemptsCount || 0) + 1;
        const status = (error as any)?.status ?? (error as any)?.response?.status;
        const isFatal = status >= 400 && status < 500 && status !== 401 && status !== 403;
        const lastError = (error as any)?.message
            || (error as any)?.data?.detail
            || (error as any)?.data?.message
            || String(error);

        const errorType = isFatal ? 'FATAL' : 'RETRYABLE';

        await storage.updateStatus(bet.externalId, isFatal ? 'blocked' : 'pending', {
            syncContext: {
                lastAttempt: Date.now(),
                attemptsCount,
                lastError,
                errorType
            },
            lastError
        });

        // Si es un error fatal, intentamos reportar a la DLQ del backend
        // Hacemos esto de forma asíncrona (fire-and-forget) para no bloquear el flujo local
        if (isFatal) {
            api.reportToDlq(bet, lastError).catch(err => {
                log.error(`Failed to report fatal error to backend DLQ for bet ${bet.externalId}`, err);
            });
        }

        return err<void, Error>(error instanceof Error ? error : new Error(String(lastError)));
    }
};

/**
 * Flow for manual synchronization of all pending bets.
 */
export const syncPendingFlow = async (
    storage: IBetStorage,
    api: IBetApi
): Promise<{ success: number; failed: number }> => {
    const pending = await storage.getPending();
    let success = 0;
    let failed = 0;

    for (const bet of pending) {
        const res = await syncSingleBet(bet, storage, api);
        if (res.isOk()) success++;
        else failed++;
    }

    return { success, failed };
};
