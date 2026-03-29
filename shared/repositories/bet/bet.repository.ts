import { Result, err } from 'neverthrow';
import { IBetRepository, BetRepositoryResult, BetDomainModel, ChildStructure, ListeroDetails, BetPlacementInput, RawBetTotals } from './bet.types';
import { IBetStorage, IBetApi } from './bet.ports';
import { logger } from '@/shared/utils/logger';
import { ListBetsFilters } from '@/shared/services/bet/types';
import { BetType } from '@/types';
import { isServerReachable } from '@/shared/utils/network';

// Flows
import { placeBetFlow, placeBatchFlow } from './flows/place-bet.flow';
import { getBetsFlow } from './flows/get-bets.flow';
import { syncPendingFlow } from './flows/sync-bets.flow';
import { getFinancialSummaryFlow, getTotalsByDrawIdFlow } from './flows/financial.flow';

// Instantiate and export singleton with default adapters
import { BetStorageAdapter } from './adapters/bet.storage.adapter';
import { BetApiAdapter } from './adapters/bet.api.adapter';
import { BetSyncListener } from './sync/bet.sync.listener';
import { offlineEventBus } from '@/shared/core/offline-storage/instance';
import { notificationRepository } from '../notification';

import { dlqRepository } from '../dlq';

const log = logger.withTag('BetRepository');

export class BetRepository implements IBetRepository {
    private readonly log = log;
    private readonly syncListener: BetSyncListener;
    private readonly subscribers: Set<() => void> = new Set();
    private syncPendingInFlight: Promise<{ success: number; failed: number }> | null = null;
    private busUnsubscribe: (() => void) | null = null;

    constructor(
        private readonly storage: IBetStorage,
        private readonly api: IBetApi
    ) {
        this.log.info(`[INIT] BetRepository constructor initialized. Instancia: ${Math.random().toString(36).substring(7)}`);
        // Iniciar el listener de eventos de sincronización
        this.syncListener = new BetSyncListener(this.storage);
        this.syncListener.start();

        this.setupEventBus();
    }

    /**
     * Configura las suscripciones al bus de eventos.
     * Puede ser llamado múltiples veces para re-suscribirse si es necesario (ej. en tests).
     */
    public setupEventBus(): void {
        if (this.busUnsubscribe) {
            this.busUnsubscribe();
        }

        this.log.info('[INIT] Suscribiéndose al offlineEventBus...');
        this.busUnsubscribe = offlineEventBus.subscribe((event) => {
            this.log.info(`[EVENT-BUS] Received event: ${event.type} for entity: ${event.entity} (Payload: ${JSON.stringify(event.payload)})`);
            const isBetSync = (event.type === 'SYNC_ITEM_SUCCESS' || event.type === 'SYNC_ITEM_ERROR') && event.entity === 'bet';
            const isBetChange = event.type === 'ENTITY_CHANGED' && event.entity?.includes('bet');

            if (isBetSync || isBetChange) {
                this.notifySubscribers();
            }

            // ESTRATEGIA: Reconciliar cuando el sistema está listo (Online + Auth)
            if (event.type === 'MAINTENANCE_COMPLETED' && (event.payload as any)?.status === 'ready') {
                this.log.info(`[RECONCILE-FLOW] Evento MAINTENANCE_COMPLETED recibido en instancia ${this.constructor.name}. Iniciando reconciliación...`);
                this.reconcileOrphanBets().catch(err => {
                    this.log.error(`[RECONCILE-FLOW] Error crítico en reconcileOrphanBets (Instancia ${this.constructor.name})`, err);
                });
            }
        });
    }

    /**
     * Busca apuestas bloqueadas o con errores persistentes y las mueve a la DLQ.
     */
    private async reconcileOrphanBets(): Promise<void> {
        this.log.info(`[RECONCILE-FLOW] 1. Buscando apuestas huérfanas (blocked o >3 intentos)... Instancia: ${this.constructor.name}`);

        const pendingBets = await this.storage.getPending();
        this.log.info(`[RECONCILE-FLOW] 2. Total pendientes recuperadas: ${pendingBets.length}. IDs: ${pendingBets.map(b => b.externalId).join(', ')}`);

        const orphanBets = pendingBets.filter(bet => {
            const attempts = bet.syncContext?.attemptsCount || 0;
            const isOrphan = bet.status === 'blocked' || attempts >= 3;
            if (isOrphan) {
                this.log.info(`[RECONCILE-FLOW] Bet ${bet.externalId} identificada como huérfana (Status: ${bet.status}, Attempts: ${attempts}, syncContext: ${JSON.stringify(bet.syncContext)})`);
            }
            return isOrphan;
        });

        if (orphanBets.length === 0) {
            this.log.info('[RECONCILE-FLOW] No se encontraron apuestas huérfanas para reconciliación');
            return;
        }

        this.log.info(`[RECONCILE-FLOW] 3. Encontradas ${orphanBets.length} apuestas huérfanas. Iniciando traspaso a DLQ.`);

        for (const bet of orphanBets) {
            try {
                this.log.info(`[RECONCILE-FLOW] 4. Procesando traspaso a DLQ para bet: ${bet.externalId}`);
                // 1. Mover a DLQ
                await dlqRepository.add('bet', bet.externalId, bet, {
                    message: bet.syncContext?.lastError || 'Reconciliación automática: Error persistente',
                    code: 'ORPHAN_RECONCILED',
                    status: 400,
                    timestamp: Date.now()
                });

                this.log.info(`[RECONCILE-FLOW] 5. Marcando localmente como synced: ${bet.externalId}`);
                // 2. Marcar localmente como sincronizada/resuelta
                await this.storage.updateStatus(bet.externalId, 'synced', {
                    syncContext: {
                        ...bet.syncContext,
                        attemptsCount: bet.syncContext?.attemptsCount || 1,
                        lastError: 'Movido a DLQ para auditoría',
                        lastAttempt: Date.now()
                    }
                });

                this.log.info(`[RECONCILE-FLOW] 6. Bet ${bet.externalId} completada exitosamente.`);
            } catch (err) {
                this.log.error(`[RECONCILE-FLOW] ERROR en traspaso de bet ${bet.externalId}`, err);
            }
        }
    }

    /**
     * Suscripción pasiva a cambios en las apuestas
     */
    onBetChanged(callback: () => void): () => void {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    private notifySubscribers(): void {
        this.subscribers.forEach(cb => {
            try {
                cb();
            } catch (error) {
                this.log.error('Error in subscriber callback', error);
            }
        });
    }

    /**
     * Optimistic Place Bet: Saves locally and tries to sync.
     */
    async placeBet(betData: BetPlacementInput): Promise<Result<BetRepositoryResult, Error>> {
        try {
            const result = await placeBetFlow(betData as any, this.storage, this.api);
            this.triggerGlobalPendingSyncIfOnline();
            return result;
        } catch (error) {
            this.log.error('Error in placeBet', error);
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Optimistic Place Batch: Saves all locally and returns pending results.
     */
    async placeBatch(bets: BetPlacementInput[]): Promise<Result<BetType[], Error>> {
        try {
            const result = await placeBatchFlow(bets as any, this.storage, this.api);
            this.triggerGlobalPendingSyncIfOnline();
            return result as Result<BetType[], Error>;
        } catch (error) {
            this.log.error('Error in placeBatch', error);
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Get all bets (Offline + Online) with deduplication.
     */
    async getBets(filters?: ListBetsFilters): Promise<Result<BetType[], Error>> {
        return await getBetsFlow(this.storage, this.api, filters);
    }

    /**
     * Sincroniza todas las apuestas pendientes.
     */
    async syncPending(): Promise<{ success: number; failed: number }> {
        if (this.syncPendingInFlight) {
            return this.syncPendingInFlight;
        }

        this.syncPendingInFlight = (async () => {
            const result = await syncPendingFlow(this.storage, this.api);

            if (result.success > 0) {
                await notificationRepository.addNotification({
                    title: 'Sincronización completada',
                    message: `Se han sincronizado ${result.success} apuestas exitosamente.`,
                    type: 'success',
                    metadata: { count: result.success, type: 'SYNC_SUCCESS' }
                });
            }

            if (result.failed > 0) {
                await notificationRepository.addNotification({
                    title: 'Error de sincronización',
                    message: `${result.failed} apuestas no pudieron sincronizarse. Se reintentará más tarde.`,
                    type: 'error',
                    metadata: { count: result.failed, type: 'SYNC_ERROR' }
                });
            }

            return result;
        })();

        try {
            return await this.syncPendingInFlight;
        } finally {
            this.syncPendingInFlight = null;
        }
    }

    private triggerGlobalPendingSyncIfOnline(): void {
        void (async () => {
            try {
                const online = await isServerReachable();
                if (!online) return;
                await this.syncPending();
            } catch (error) {
                this.log.warn('Background global pending sync skipped after place flow', error);
            }
        })();
    }

    /**
     * Resets the sync status of a bet (DLQ Reprocessing).
     * Clears error context and sets status back to pending.
     */
    async resetSyncStatus(offlineId: string): Promise<void> {
        try {
            this.log.info(`Resetting sync status for bet ${offlineId}`);

            // 1. Actualizar en el almacenamiento local
            await this.storage.updateStatus(offlineId, 'pending', {
                syncContext: undefined, // Limpiar el contexto de error (DLQ)
                lastError: undefined
            });

            // 2. Opcionalmente podríamos disparar un trigger de sync aquí, 
            // pero el worker lo recogerá en su ciclo habitual.
        } catch (error) {
            this.log.error(`Failed to reset sync status for bet ${offlineId}`, error);
            throw error;
        }
    }

    /**
     * Get financial summary for a period and structure.
     */
    async getFinancialSummary(todayStart: number, structureId?: string): Promise<RawBetTotals> {
        return await getFinancialSummaryFlow(this.storage, todayStart, structureId);
    }

    /**
     * Get totals grouped by Draw ID for a period and structure.
     */
    async getTotalsByDrawId(todayStart: number, structureId?: string): Promise<Record<string, RawBetTotals>> {
        return await getTotalsByDrawIdFlow(this.storage, todayStart, structureId);
    }

    /**
     * Checks if there are critical pending or failed bets before a specific timestamp.
     */
    async hasCriticalPendingBets(beforeTimestamp: number): Promise<boolean> {
        try {
            const allBets = await this.storage.getAll();
            return allBets.some(bet =>
                (bet.status === 'pending' || bet.status === 'error' || bet.status === 'blocked') &&
                bet.timestamp < beforeTimestamp
            );
        } catch (error) {
            this.log.error('Error checking critical pending bets', error);
            return false;
        }
    }

    /**
     * Get all raw bets from local storage.
     */
    async getAllRawBets(): Promise<BetDomainModel[]> {
        return await this.storage.getAll();
    }

    /**
     * Obtiene solo las apuestas pendientes (offline)
     */
    async getPendingBets(): Promise<BetDomainModel[]> {
        return await this.storage.getPending();
    }

    /**
     * Agrega una apuesta pendiente directamente al almacenamiento offline.
     * Útil para tests o para inyectar apuestas que deben ser sincronizadas.
     */
    async addPendingBet(bet: BetDomainModel): Promise<void> {
        this.log.debug('Adding manual pending bet', bet);
        await this.storage.save(bet);

        // Notificar a la UI sobre la apuesta pendiente guardada offline
        await notificationRepository.addNotification({
            title: 'Apuesta guardada offline',
            message: `La apuesta por ${bet.amount} se guardará localmente hasta que recuperes la conexión.`,
            type: 'warning',
            metadata: { betId: (bet as any).id, type: 'OFFLINE_BET' }
        });

        this.notifySubscribers();
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
            this.log.error('Error checking if app is blocked', error);
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
                await this.storage.delete(bet.externalId);
            }

            return toDelete.length;
        } catch (error) {
            this.log.error('Error cleaning up failed bets', error);
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

            this.log.info(`Found ${stuck.length} stuck bets to recover`);

            for (const bet of stuck) {
                await this.storage.updateStatus(bet.externalId, 'pending');
            }

            return stuck.length;
        } catch (error) {
            this.log.error('Error recovering stuck bets', error);
            return 0;
        }
    }

    async applyMaintenance(): Promise<void> {
        this.log.info('Applying maintenance to BetRepository');
        await this.cleanupFailedBets();
        await this.recoverStuckBets();
    }

    /**
     * Limpia apuestas sincronizadas antiguas para liberar almacenamiento local.
     * Solo elimina apuestas con estado 'synced' anteriores al inicio del día especificado.
     * 
     * @param today Fecha en formato YYYY-MM-DD (proporcionada por el servidor/TimerRepository)
     * @returns Número de apuestas eliminadas
     */
    async cleanup(today: string): Promise<number> {
        try {
            this.log.info('Starting bet cleanup', { today });
            const allBets = await this.storage.getAll();

            // Interpretación explícita en UTC para evitar desfases de zona horaria
            const [year, month, day] = today.split('-').map(Number);
            const todayStartTimestamp = Date.UTC(year, month - 1, day, 0, 0, 0, 0);

            const toDelete = allBets.filter(b =>
                b.status === 'synced' &&
                b.timestamp < todayStartTimestamp
            );

            this.log.debug(`Found ${toDelete.length} synced bets to cleanup`, {
                total: allBets.length,
                todayStartTimestamp
            });

            for (const bet of toDelete) {
                await this.storage.delete(bet.externalId);
            }

            return toDelete.length;
        } catch (error) {
            this.log.error('Error in bet cleanup', error);
            throw error; // Propagamos el error para que el Janitor lo detecte
        }
    }

    async getChildren(id: number, level: number = 1): Promise<ChildStructure[]> {
        return this.api.getChildren(id, level);
    }

    async getListeroDetails(id: number, date?: string): Promise<ListeroDetails> {
        return this.api.getListeroDetails(id, date);
    }

    /**
     * Delete a bet by backend ID (for test cleanup)
     */
    async delete(betId: number): Promise<void> {
        await this.api.delete(betId);
    }

    async isReady(): Promise<boolean> {
        // El repositorio está listo si su almacenamiento lo está
        return true; // En este punto el storage ya debería estar inicializado vía constructor/singleton
    }
}

// Export singleton
export const betRepository = new BetRepository(
    new BetStorageAdapter(),
    new BetApiAdapter()
);
