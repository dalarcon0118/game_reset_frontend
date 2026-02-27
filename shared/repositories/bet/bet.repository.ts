import { Result, ok, err } from 'neverthrow';
import { IBetRepository, BetRepositoryResult, BetDomainModel } from './bet.types';
import { IBetStorage, IBetApi } from './bet.ports';
import { BetLogic } from './bet.logic';
import { mapBackendBetToFrontend, mapSinglePendingBetToFrontend, mapPendingBetsToFrontend } from '@/shared/services/bet/mapper';
import { DrawRepository } from '../draw.repository';
import { isServerReachable } from '@/shared/utils/network';
import { logger } from '@/shared/utils/logger';
import { ListBetsFilters } from '@/shared/services/bet/types';
import { BetType } from '@/types';

// Instantiate and export singleton with default adapters
import { BetStorageAdapter } from './adapters/bet.storage.adapter';
import { BetApiAdapter } from './adapters/bet.api.adapter';

const log = logger.withTag('BetRepository');

/**
 * Agnostic Bet Repository following the Refactor Workflow.
 * Orchestrates Storage and API through ports.
 */
export class BetRepository implements IBetRepository {
    constructor(
        private readonly storage: IBetStorage,
        private readonly api: IBetApi
    ) { }

    /**
     * Optimistic Place Bet: Saves locally and tries to sync.
     */
    async placeBet(betData: BetDomainModel['data']): Promise<Result<BetRepositoryResult, Error>> {
        try {
            // 1. Business Logic: Check Blocking
            const allBets = await this.storage.getAll();
            const { blocked } = BetLogic.isAppBlocked(allBets);
            if (blocked) {
                return err(new Error('APUESTA_BLOQUEADA: Debes sincronizar antes de continuar.'));
            }

            // 2. Prepare Domain Model
            const offlineId = this.generateUuid();
            const bet: BetDomainModel = {
                offlineId,
                status: 'pending',
                data: betData,
                timestamp: Date.now()
            };

            // 3. Persistent Save (Optimistic)
            await this.storage.save(bet);

            // Fetch bet types for mapping
            const betTypesResult = await DrawRepository.getBetTypes(String(betData.drawId || ''));
            const betTypes = betTypesResult.isOk() ? betTypesResult.value : [];

            // 4. Try Sync (Optional, manual sync will be the main driver)
            if (await isServerReachable()) {
                try {
                    const response = await this.api.create(betData, offlineId);

                    const backendBets = Array.isArray(response) ? response : [response];
                    const mappedBets = backendBets.map(b => mapBackendBetToFrontend(b, betTypes));

                    await this.storage.updateStatus(offlineId, 'synced', {
                        backendBets: mappedBets
                    });

                    return ok(Array.isArray(response) ? mappedBets : mappedBets[0]);
                } catch (apiError) {
                    log.warn('Initial sync failed, keeping as pending', apiError);
                    // Keep as PENDING for manual sync later
                }
            }

            return ok(mapSinglePendingBetToFrontend({ ...bet, offlineId } as any, betTypes));

        } catch (error) {
            log.error('Error in placeBet', error);
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Get all bets (Offline + Online) with deduplication.
     */
    async getBets(filters?: ListBetsFilters): Promise<Result<BetType[], Error>> {
        const startTime = Date.now();
        try {
            let onlineBets: BetType[] = [];
            let offlineBets: BetType[] = [];

            // 0. Fetch BetTypes for better mapping
            const betTypesResult = await DrawRepository.getBetTypes(filters?.drawId || '');
            const betTypes = betTypesResult.isOk() ? betTypesResult.value : [];

            // 1. Get Offline Bets
            try {
                const allOffline = await this.storage.getAll();
                // We map all offline bets that match filters
                // Note: mapPendingBetsToFrontend handles status filtering if needed
                offlineBets = mapPendingBetsToFrontend(allOffline as any, filters, betTypes);
            } catch (e) {
                log.error('Failed to fetch offline bets', e);
            }

            // 2. Get Online Bets
            try {
                if (await isServerReachable()) {
                    const response = await this.api.list(filters);
                    onlineBets = response
                        .map(b => {
                            try { return mapBackendBetToFrontend(b, betTypes); }
                            catch (e) {
                                log.warn('Mapping error for bet', { betId: b.id, error: e });
                                return null;
                            }
                        })
                        .filter(Boolean) as BetType[];
                }
            } catch (e) {
                log.warn('Failed to fetch online bets', e);
            }

            // 3. Merge results with deduplication
            const betsMap = new Map<string, BetType>();

            // First add offline bets
            offlineBets.forEach(bet => {
                const key = bet.receiptCode || bet.id;
                if (key && !betsMap.has(key)) {
                    betsMap.set(key, bet);
                }
            });

            // Then add online bets (will overwrite offline if same receiptCode)
            onlineBets.forEach(bet => {
                const key = bet.receiptCode || bet.id;
                if (key) {
                    betsMap.set(key, bet);
                }
            });

            const totalBets = Array.from(betsMap.values());
            log.info(`FINISH getBets in ${Date.now() - startTime}ms`, {
                total: totalBets.length,
                offline: offlineBets.length,
                online: onlineBets.length
            });

            return ok(totalBets);

        } catch (error) {
            log.error('Error in getBets', error);
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Optimistic Place Batch: Saves all locally and tries to sync.
     */
    async placeBatch(bets: BetDomainModel['data'][]): Promise<Result<BetType[], Error>> {
        try {
            // 1. Business Logic: Check Blocking
            const allExistingBets = await this.storage.getAll();
            const { blocked } = BetLogic.isAppBlocked(allExistingBets);
            if (blocked) {
                return err(new Error('APUESTA_BLOQUEADA: Debes sincronizar antes de continuar.'));
            }

            // 2. Prepare Domain Models
            const domainModels: BetDomainModel[] = bets.map(data => ({
                offlineId: this.generateUuid(),
                status: 'pending',
                data,
                timestamp: Date.now()
            }));

            // 3. Persistent Save (Optimistic)
            for (const bet of domainModels) {
                await this.storage.save(bet);
            }

            // Fetch bet types for mapping
            const drawId = bets[0]?.drawId;
            const betTypesResult = await DrawRepository.getBetTypes(String(drawId || ''));
            const betTypes = betTypesResult.isOk() ? betTypesResult.value : [];

            // 4. Try Sync (Batch creation if API supports it, or sequential)
            if (await isServerReachable()) {
                try {
                    // Assuming API supports batch via CreateBetDTO[] or sequential
                    // For now, let's use the first one's offlineId as idempotency for the whole batch if API supports it
                    // or handle individually. Let's assume sequential for safety if API.create only takes one.
                    // But usually, we want batch.
                    
                    const syncedBets: BetType[] = [];
                    for (const bet of domainModels) {
                        const response = await this.api.create(bet.data, bet.offlineId);
                        const backendBets = Array.isArray(response) ? response : [response];
                        const mappedBets = backendBets.map(b => mapBackendBetToFrontend(b, betTypes));
                        
                        await this.storage.updateStatus(bet.offlineId, 'synced', {
                            backendBets: mappedBets
                        });
                        syncedBets.push(...mappedBets);
                    }
                    
                    return ok(syncedBets);
                } catch (apiError) {
                    log.warn('Batch sync failed, keeping as pending', apiError);
                }
            }

            // Return mapped pending bets
            const mappedPending = domainModels.map(bet => 
                mapSinglePendingBetToFrontend({ ...bet } as any, betTypes)
            );
            return ok(mappedPending);

        } catch (error) {
            log.error('Error in placeBatch', error);
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Manual Sync: Triggers synchronization of all pending bets.
     */
    async syncPending(): Promise<{ success: number; failed: number }> {
        const pending = await this.storage.getPending();
        let success = 0;
        let failed = 0;

        for (const bet of pending) {
            try {
                const response = await this.api.create(bet.data, bet.offlineId);
                const backendBets = Array.isArray(response) ? response : [response];

                const betTypesResult = await DrawRepository.getBetTypes(String(bet.data.drawId || ''));
                const betTypes = betTypesResult.isOk() ? betTypesResult.value : [];

                const mappedBets = backendBets.map(b => mapBackendBetToFrontend(b, betTypes));

                await this.storage.updateStatus(bet.offlineId, 'synced', {
                    backendBets: mappedBets
                });
                success++;
            } catch (error) {
                log.error(`Failed to sync bet ${bet.offlineId}`, error);
                await this.storage.updateStatus(bet.offlineId, 'error');
                failed++;
            }
        }

        return { success, failed };
    }

    /**
     * Applies maintenance policies (Blocking and Reset).
     */
    async applyMaintenance(): Promise<void> {
        try {
            const allBets = await this.storage.getAll();
            const now = Date.now();

            // 1. Apply Blocking (24h)
            const { updated: blockedBets, changes: blockedChanges } = BetLogic.applyBlockingPolicy(allBets, now);

            // 2. Apply Midnight Reset
            const { updated: resetBets, changes: resetChanges } = BetLogic.applyMidnightReset(blockedBets);

            if (blockedChanges > 0 || resetChanges > 0) {
                log.info(`Maintenance applied: ${blockedChanges} blocked, ${resetChanges} reset`);
                for (const bet of resetBets) {
                    const original = allBets.find(b => b.offlineId === bet.offlineId);
                    if (original && original.status !== bet.status) {
                        await this.storage.updateStatus(bet.offlineId, bet.status);
                    }
                }
            }
        } catch (error) {
            log.error('Error applying maintenance', error);
        }
    }

    private generateUuid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
}

export const betRepository = new BetRepository(
    new BetStorageAdapter(),
    new BetApiAdapter()
);
