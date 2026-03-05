import { Result, ok, err, okAsync, ResultAsync } from 'neverthrow';
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
    return okAsync(bet)
        .andThen(b => {
            const amount = Number(b.amount) || 0;
            const structureId = b.ownerStructure;
            if (amount <= 0 || !structureId) {
                return err(new Error(`ERROR_CRITICO_SYNC: Datos inválidos en apuesta ${b.externalId}`));
            }
            return ok(b);
        })
        .andThen(b => {
            return new ResultAsync((async () => {
                log.info(`Syncing bet ${b.externalId} with backend...`);
                const response = await api.create(b as any, b.externalId);
                const backendBets = Array.isArray(response) ? response : [response];
                return ok({ bet: b, backendBets });
            })());
        })
        .andThen(ctx => {
            return new ResultAsync((async () => {
                const betTypesResult = await drawRepository.getBetTypes(String(ctx.bet.drawId || ''));
                const betTypes: GameType[] = betTypesResult.isOk()
                    ? betTypesResult.value.map((t): GameType => ({
                        id: String(t.id),
                        name: t.name,
                        code: t.code || '',
                        description: t.description || ''
                    }))
                    : [];

                const mappedBets = ctx.backendBets.map(b => mapBackendBetToFrontend(b, betTypes));
                await storage.updateStatus(ctx.bet.externalId, 'synced', { backendBets: mappedBets });
                return ok<void, Error>(undefined);
            })());
        })
        .orElse(error => {
            return new ResultAsync((async () => {
                log.error(`Failed to sync bet ${bet.externalId}`, error);
                await storage.updateStatus(bet.externalId, 'error');
                return err<void, Error>(error);
            })());
        });
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
