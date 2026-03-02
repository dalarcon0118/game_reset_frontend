import { Result, ok, err } from 'neverthrow';
import { IBetRepository, BetRepositoryResult, BetDomainModel, ChildStructure, ListeroDetails } from './bet.types';
import { IBetStorage, IBetApi } from './bet.ports';
import { BetLogic } from './bet.logic';
import { BetMaintenancePolicies } from './bet.maintenance';
import { mapBackendBetToFrontend, mapSinglePendingBetToFrontend, mapPendingBetsToFrontend } from '@/shared/services/bet/mapper';
import { drawRepository } from '../draw';
import { financialRepository, FinancialKeys } from '../financial/ledger.repository';
import { syncWorker, offlineEventBus } from '@/shared/core/offline-storage/instance';
import { isServerReachable } from '@/shared/utils/network';
import { logger } from '@/shared/utils/logger';
import { ListBetsFilters } from '@/shared/services/bet/types';
import { BetType, GameType } from '@/types';
import { FinancialImpact } from '@/shared/core/offline-storage/types';

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

            // 2. Critical Validation: Amount > 0 and owner_structure mandatory
            const amount = Number(betData.amount) || 0;
            const structureId = betData.owner_structure;

            if (amount <= 0) {
                const errorMsg = `ERROR_CRITICO: No se puede crear una apuesta con monto 0 o inválido (${betData.amount}).`;
                log.error(errorMsg, { betData });
                return err(new Error(errorMsg));
            }

            if (!structureId) {
                const errorMsg = 'ERROR_CRITICO: owner_structure es obligatorio para crear una apuesta y registrar su estado financiero.';
                log.error(errorMsg, { betData });
                return err(new Error(errorMsg));
            }

            // 3. Prepare Domain Model
            const offlineId = this.generateUuid();
            const commissionRate = betData.commissionRate ?? 0.1;
            const financialImpact: FinancialImpact = {
                totalCollected: amount,
                commission: amount * commissionRate,
                netAmount: amount * (1 - commissionRate)
            };

            const bet: BetDomainModel = {
                offlineId,
                status: 'pending',
                data: betData,
                financialImpact,
                timestamp: Date.now()
            };

            // 4. Persistent Save (Optimistic)
            await this.storage.save(bet);

            // 5. Register Financial Transaction (offline-first)
            try {
                // Origin format: "structure:ID:draw:ID:bet:ID"
                const origin = FinancialKeys.forBet(
                    String(structureId),
                    betData.drawId,
                    offlineId
                );
                await financialRepository.addCredit(origin, amount);

                // Emit event for state change
                offlineEventBus.publish({
                    type: 'SYNC_ITEM_SUCCESS',
                    entity: 'bet',
                    payload: {
                        id: offlineId,
                        drawId: betData.drawId,
                        changeType: 'local_added'
                    },
                    timestamp: Date.now()
                });
            } catch (financialError) {
                log.warn('Failed to register financial transaction', financialError);
                // Continue - bet is saved, financial update can be retried
            }

            // Fetch bet types for mapping
            const betTypesResult = await drawRepository.getBetTypes(String(betData.drawId || ''));
            const betTypes: GameType[] = betTypesResult.isOk()
                ? betTypesResult.value.map((t): GameType => ({
                    id: String(t.id),
                    name: t.name,
                    code: t.code || '',
                    description: t.description || ''
                }))
                : [];

            // 6. Try Sync (Optional, manual sync will be the main driver)
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
            const betTypesResult = await drawRepository.getBetTypes(filters?.drawId || '');
            const betTypes: GameType[] = betTypesResult.isOk()
                ? betTypesResult.value.map((t): GameType => ({
                    id: String(t.id),
                    name: t.name,
                    code: t.code || '',
                    description: t.description || ''
                }))
                : [];

            // 1. Get Offline Bets
            try {
                const allOffline = await this.storage.getAll();
                // We map all offline bets that match filters
                // Note: mapPendingBetsToFrontend handles status filtering if needed
                log.info('OFFLINE_BETS_STORAGE', {
                    drawId: filters?.drawId,
                    totalInStorage: allOffline.length,
                    sample: allOffline.slice(0, 2).map(b => ({ offlineId: b.offlineId, status: b.status, drawId: b.data?.drawId, draw: b.data?.draw }))
                });
                offlineBets = mapPendingBetsToFrontend(allOffline as any, filters, betTypes);

                if (offlineBets.length > 0) {
                    log.info('OFFLINE_BETS_LOADED', {
                        drawId: filters?.drawId,
                        count: offlineBets.length,
                        source: 'local_storage'
                    });
                }
            } catch (e) {
                log.error('Failed to fetch offline bets', e);
            }

            // 2. Get Online Bets
            try {
                if (await isServerReachable()) {
                    log.debug('FETCH_ONLINE_BETS', { drawId: filters?.drawId, filters });
                    const response = await this.api.list(filters);
                    log.info('ONLINE_BETS_RESPONSE', {
                        drawId: filters?.drawId,
                        responseCount: response.length,
                        responseSample: response.slice(0, 2)
                    });
                    onlineBets = response
                        .map(b => {
                            try { return mapBackendBetToFrontend(b, betTypes); }
                            catch (e) {
                                log.warn('Mapping error for bet', { betId: b.id, error: e });
                                return null;
                            }
                        })
                        .filter(Boolean) as BetType[];

                    if (onlineBets.length > 0) {
                        log.info('ONLINE_BETS_LOADED', {
                            drawId: filters?.drawId,
                            count: onlineBets.length
                        });
                    }
                } else {
                    log.info('SERVER_NOT_REACHABLE', {
                        drawId: filters?.drawId,
                        message: 'No se pudo acceder al servidor, usando solo datos offline'
                    });
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
                online: onlineBets.length,
                totalBetsSample: totalBets.slice(0, 3).map(b => ({ id: b.id, type: b.type, draw: b.draw, amount: b.amount }))
            });

            return ok(totalBets);

        } catch (error) {
            log.error('Error in getBets', error);
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Obtiene solo las apuestas pendientes (offline)
     */
    async getPendingBets(): Promise<BetDomainModel[]> {
        return await this.storage.getPending();
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

            // 2. Critical Validation for each bet in the batch
            for (let i = 0; i < bets.length; i++) {
                const b = bets[i];
                const amount = Number(b.amount) || 0;
                if (amount <= 0) {
                    return err(new Error(`ERROR_CRITICO_BATCH: Item ${i} tiene monto 0 o inválido.`));
                }
                if (!b.owner_structure) {
                    return err(new Error(`ERROR_CRITICO_BATCH: Item ${i} no tiene owner_structure.`));
                }
            }

            // 3. Prepare Domain Models
            const domainModels: BetDomainModel[] = bets.map(data => {
                const amount = Number(data.amount) || 0;
                const commissionRate = data.commissionRate ?? 0.1;
                const financialImpact: FinancialImpact = {
                    totalCollected: amount,
                    commission: amount * commissionRate,
                    netAmount: amount * (1 - commissionRate)
                };

                return {
                    offlineId: this.generateUuid(),
                    status: 'pending',
                    data,
                    financialImpact,
                    timestamp: Date.now()
                };
            });

            // 4. Persistent Save (Optimistic)
            for (const bet of domainModels) {
                await this.storage.save(bet);
            }

            // 5. Register Financial Transactions for each bet (offline-first)
            try {
                for (let i = 0; i < bets.length; i++) {
                    const betData = bets[i];
                    const domainModel = domainModels[i];

                    const amount = Number(betData.amount) || 0;
                    const structureId = String(betData.owner_structure);

                    const origin = FinancialKeys.forBet(
                        structureId,
                        betData.drawId,
                        domainModel.offlineId
                    );
                    await financialRepository.addCredit(origin, amount);

                    // Emit event for state change
                    offlineEventBus.publish({
                        type: 'SYNC_ITEM_SUCCESS',
                        entity: 'bet',
                        payload: {
                            id: domainModel.offlineId,
                            drawId: betData.drawId,
                            changeType: 'local_added'
                        },
                        timestamp: Date.now()
                    });
                }
            } catch (financialError) {
                log.warn('Failed to register financial transactions for batch', financialError);
            }

            // Fetch bet types for mapping
            const drawId = bets[0]?.drawId;
            const betTypesResult = await drawRepository.getBetTypes(String(drawId || ''));
            const betTypes: GameType[] = betTypesResult.isOk()
                ? betTypesResult.value.map((t): GameType => ({
                    id: String(t.id),
                    name: t.name,
                    code: t.code || '',
                    description: t.description || ''
                }))
                : [];

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
                // Critical Validation: Amount > 0 and owner_structure mandatory
                const amount = Number(bet.data.amount) || 0;
                const structureId = bet.data.owner_structure;

                if (amount <= 0 || !structureId) {
                    const errorMsg = `ERROR_CRITICO_SYNC: Datos inválidos en apuesta ${bet.offlineId} (monto: ${amount}, estructura: ${structureId}). Saltando sincronización.`;
                    log.error(errorMsg, { betData: bet.data });
                    await this.storage.updateStatus(bet.offlineId, 'error');
                    failed++;
                    continue;
                }

                const response = await this.api.create(bet.data, bet.offlineId);
                const backendBets = Array.isArray(response) ? response : [response];

                const betTypesResult = await drawRepository.getBetTypes(String(bet.data.drawId || ''));
                const betTypes: GameType[] = betTypesResult.isOk()
                    ? betTypesResult.value.map((t): GameType => ({
                        id: String(t.id),
                        name: t.name,
                        code: t.code || '',
                        description: t.description || ''
                    }))
                    : [];

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
     * Checks if the application should be blocked due to old unsynced bets.
     */
    async isAppBlocked(): Promise<{ blocked: boolean; blockedBetsCount: number }> {
        try {
            const blockedBets = await this.storage.getByStatus('blocked');
            return {
                blocked: blockedBets.length > 0,
                blockedBetsCount: blockedBets.length
            };
        } catch (error) {
            log.error('Error checking if app is blocked', error);
            return { blocked: false, blockedBetsCount: 0 };
        }
    }

    /**
     * Cleans up old failed bets.
     */
    async cleanupFailedBets(days: number = 7): Promise<number> {
        try {
            const allBets = await this.storage.getAll();
            const now = Date.now();
            const threshold = days * 24 * 60 * 60 * 1000;
            const toDelete = allBets.filter(b =>
                (b.status === 'error' || b.status === 'blocked') &&
                (now - b.timestamp) > threshold
            );

            for (const bet of toDelete) {
                await this.storage.delete(bet.offlineId);
            }

            return toDelete.length;
        } catch (error) {
            log.error('Error cleaning up failed bets', error);
            return 0;
        }
    }

    /**
     * Recovers stuck bets with recoverable errors.
     */
    async recoverStuckBets(): Promise<number> {
        try {
            const pending = await this.storage.getPending();
            const recoverableErrors = [
                'No ID received',
                'Network request failed',
                'timeout',
                '500', '502', '503', '504', '408'
            ];

            const stuck = pending.filter(bet => {
                if (bet.status !== 'error') return false;
                const error = (bet as any).lastError || '';
                return recoverableErrors.some(err => error.includes(err));
            });

            log.info(`Found ${stuck.length} stuck bets to recover`);

            for (const bet of stuck) {
                await this.storage.updateStatus(bet.offlineId, 'pending', {
                    retryCount: 0,
                    lastError: undefined
                });
            }

            if (stuck.length > 0) {
                await syncWorker.triggerSync();
            }

            return stuck.length;
        } catch (error) {
            log.error('Error recovering stuck bets', error);
            return 0;
        }
    }

    /**
     * Applies maintenance policies to bets.
     */
    async applyMaintenance(): Promise<void> {
        try {
            const allBets = await this.storage.getAll();
            const now = Date.now();

            // 1. Apply Blocking (using policies that use SYNC_CONSTANTS)
            const { updated: blockedBets, changes: blockedChanges } = BetMaintenancePolicies.blockOldBets(now)(allBets);

            // 2. Apply Midnight Reset
            const { updated: resetBets, changes: resetChanges } = BetMaintenancePolicies.midnightReset()(blockedBets);

            if (blockedChanges > 0 || resetChanges > 0) {
                log.info(`Maintenance applied: ${blockedChanges} blocked, ${resetChanges} reset`);

                // Persistir cambios
                for (const bet of resetBets) {
                    const original = allBets.find(b => b.offlineId === bet.offlineId);
                    if (original && original.status !== bet.status) {
                        await this.storage.updateStatus(bet.offlineId, bet.status, {
                            lastError: bet.status === 'blocked' ? (bet as any).lastError : undefined
                        });
                    }
                }
            }

            // 3. Cleanup old failed/blocked bets (e.g., older than 7 days)
            const cleanedCount = await this.cleanupFailedBets(7);
            if (cleanedCount > 0) {
                log.info(`Cleanup applied: ${cleanedCount} old bets removed`);
            }
        } catch (error) {
            log.error('Error applying maintenance', error);
        }
    }

    /**
     * Get children nodes for a structure (moved from StructureService)
     */
    async getChildren(id: number, level: number = 1): Promise<ChildStructure[]> {
        try {
            return await this.api.getChildren(id, level);
        } catch (error) {
            log.error('Error fetching children structures', error);
            return [];
        }
    }

    /**
     * Get listero details for a structure (moved from StructureService)
     */
    async getListeroDetails(id: number, date?: string): Promise<ListeroDetails> {
        try {
            return await this.api.getListeroDetails(id, date);
        } catch (error) {
            log.error(`Error fetching listero details for ID ${id}`, error);
            throw error;
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
