import { IDlqRepository, IDlqStorage, IDlqApi } from './dlq.ports';
import { DlqItem, DlqError, DlqStats } from './dlq.types';
import { logger } from '@/shared/utils/logger';
import { DlqSyncListener } from './sync/dlq.sync.listener';
import { SyncAdapter } from '@core/offline-storage/sync/adapter';
import { notificationRepository } from '../notification';

const log = logger.withTag('DlqRepository');

export class DlqRepository implements IDlqRepository {
    private readonly log = log;
    private syncListener: DlqSyncListener;

    constructor(
        private readonly storage: IDlqStorage,
        private readonly api: IDlqApi
    ) {
        this.syncListener = new DlqSyncListener(this.storage, (id) => this.markAsReconciled(id));
        this.syncListener.start();
    }

    /**
     * Permite re-vincular el repositorio al bus de eventos.
     * Útil para entornos de test donde el bus se limpia entre ejecuciones.
     */
    public setupEventBus(): void {
        this.log.info('[DLQ-REPO] Re-inicializando suscripciones del bus de eventos...');
        if (this.syncListener) {
            this.syncListener.stop();
        }
        this.syncListener = new DlqSyncListener(this.storage, (id) => this.markAsReconciled(id));
        this.syncListener.start();
    }

    /**
     * Agrega un elemento a la DLQ.
     */
    async add<T>(domain: string, entityId: string, payload: T, error: DlqError): Promise<string> {
        this.log.info(`[DLQ-REPO] 1. Agregando item a DLQ: ${domain}:${entityId}`);

        try {
            const id = await this.storage.add(domain, entityId, payload, error);
            this.log.info(`[DLQ-REPO] 2. Item guardado en DLQ: ${id}`);

            // 3. Registrar en la cola de sincronización global
            const item = await this.storage.getById(id);
            if (item) {
                await SyncAdapter.addToQueue({
                    type: 'dlq',
                    entityId: id,
                    priority: 1, // Prioridad normal para DLQ
                    data: item,
                    attempts: 0,
                    status: 'pending'
                });
                this.log.info(`[DLQ-REPO] 3. Item ${id} registrado en la cola de sincronización.`);
            }

            // 4. Notificar proactivamente al usuario
            await notificationRepository.addNotification({
                title: 'Revisión requerida',
                message: `Una operación de ${domain} ha fallado repetidamente y requiere revisión manual.`,
                type: 'error',
                metadata: { entityId, domain, errorCode: error.code }
            });

            this.notifyChanged();
            return id;
        } catch (err) {
            this.log.error(`[DLQ-REPO] ERROR al guardar en DLQ: ${domain}:${entityId}`, err);
            throw err;
        }
    }

    async getByDomain(domain: string): Promise<DlqItem[]> {
        return await this.storage.getByDomain(domain);
    }

    async getById(id: string): Promise<DlqItem | null> {
        return await this.storage.getById(id);
    }

    async getAll(): Promise<DlqItem[]> {
        return await this.storage.getAll();
    }

    async markAsReconciled(id: string): Promise<void> {
        this.log.info(`[DLQ-FLOW] 5. Iniciando reconciliación de item: ${id}`);
        try {
            // 1. Marcar localmente
            await this.storage.updateStatus(id, 'reconciled');
            this.log.info(`[DLQ-FLOW] 6. Item ${id} marcado localmente como "reconciled".`);

            // 2. Reportar al backend
            const item = await this.storage.getById(id);
            if (item) {
                this.log.info(`[DLQ-FLOW] 7. Reportando reconciliación al backend para item ${id}...`);
                await this.api.reconcile(id, 'reconcile');
                this.log.info(`[DLQ-FLOW] 8. Reporte al backend exitoso para item ${id}.`);
            }
        } catch (error) {
            this.log.error(`[DLQ-FLOW] ERROR en reconciliación de item ${id}`, error);
            throw error;
        }
    }

    async markAsDiscarded(id: string): Promise<void> {
        this.log.info(`Marking DLQ item as discarded: ${id}`);
        await this.storage.updateStatus(id, 'discarded');
        const item = await this.storage.getById(id);
        if (item) {
            await this.api.reconcile(id, 'discard');
        }
    }

    async delete(id: string): Promise<void> {
        await this.storage.delete(id);
    }

    async syncToBackend(): Promise<{ success: number; failed: number }> {
        const items = await this.storage.getAll();
        const pendingItems = items.filter(item => item.status === 'pending');

        if (pendingItems.length === 0) {
            this.log.debug('No pending DLQ items to sync');
            return { success: 0, failed: 0 };
        }

        this.log.info(`Syncing ${pendingItems.length} pending DLQ items to backend`);
        const result = await this.api.syncItems(pendingItems);

        if (result.success > 0) {
            // Marcamos como reconciliados según el conteo de éxito
            for (const item of pendingItems.slice(0, result.success)) {
                await this.storage.updateStatus(item.id, 'reconciled');
            }
        }

        return result;
    }

    async cleanup(): Promise<number> {
        return await this.storage.cleanup();
    }

    async getStats(): Promise<DlqStats> {
        return await this.storage.getStats();
    }

    private notifyChanged() {
        // Implementation for change notification if needed
    }
}
