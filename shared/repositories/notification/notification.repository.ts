import { INotificationRepository, Notification } from './notification.ports';
import { NotificationApi } from './api/api';
import { NotificationOfflineAdapter } from './adapters/notification.offline.adapter';
import { isServerReachable } from '@/shared/utils/network';
import { logger } from '@/shared/utils/logger';
import { AuthRepository } from '../auth';
import { TimerRepository } from '@/shared/repositories/system/time';
import { syncWorker } from '@core/offline-storage/instance';
import { NotificationSyncListener } from './sync/notification.sync.listener';

const log = logger.withTag('NotificationRepository');

/**
 * 🏛️ NOTIFICATION REPOSITORY (Robust SSOT & Offline-First)
 * 
 * Implementación de grado industrial:
 * - Determinismo: Usa TimeService como fuente única de tiempo.
 * - Resiliencia: Delega sincronización al SyncWorker global (con reintentos).
 * - Integridad: Reconciliación LWW con Tombstones para evitar "resurrecciones".
 * - Higiene: Mantenimiento automático de 3 días.
 */
export class NotificationRepository implements INotificationRepository {
    private syncListener: NotificationSyncListener;

    constructor(
        private offlineAdapter: NotificationOfflineAdapter = new NotificationOfflineAdapter(),
        private api: typeof NotificationApi = NotificationApi
    ) {
        this.syncListener = new NotificationSyncListener();
        this.syncListener.start();
    }

    private getTrustedNow(): number {
        return TimerRepository.getTrustedNow(Date.now());
    }

    private async getUserId(): Promise<string> {
        const user = await AuthRepository.getUserIdentity();
        if (!user) throw new Error('UNAUTHORIZED_NOTIFICATION_ACCESS');
        return String(user.id);
    }

    /**
     * Retorna inmediatamente el SSOT local y dispara tareas de fondo.
     */
    async getNotifications(): Promise<Notification[]> {
        try {
            const userId = await this.getUserId();
            this.runBackgroundTasks(userId).catch(e => log.debug('Background tasks deferred', e));
            return this.offlineAdapter.getAll(userId);
        } catch (error) {
            log.error('Failed to get notifications from SSOT', error);
            return [];
        }
    }

    private async runBackgroundTasks(userId: string): Promise<void> {
        // 1. Reconciliación con el servidor
        await this.syncRemoteToLocal(userId);

        // 2. Higiene: Limpieza de antiguos (> 3 días)
        await this.cleanupOldNotifications(userId);
    }

    private async cleanupOldNotifications(userId: string): Promise<void> {
        const local = await this.offlineAdapter.getAll(userId);
        const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
        const now = this.getTrustedNow();

        // 1. Limpiar notificaciones antiguas
        const toDelete = local.filter(n => (now - new Date(n.createdAt).getTime()) > THREE_DAYS_MS);
        if (toDelete.length > 0) {
            log.debug(`Janitor: cleaning ${toDelete.length} expired notifications`);
            await Promise.all(toDelete.map(n => this.offlineAdapter.delete(userId, n.id)));
        }

        // 2. Opcional: Limpiar tombstones antiguos (ej. > 7 días) para no acumular basura infinita
        // Esto se podría implementar en el adapter si fuera necesario.
    }

    private async syncRemoteToLocal(userId: string): Promise<void> {
        if (!(await isServerReachable())) return;

        try {
            const remote = await this.api.getNotifications() as Notification[];
            const local = await this.offlineAdapter.getAll(userId);

            const localById = new Map(local.map(n => [n.id, n]));
            const localByClientId = new Map(local.filter(n => n.clientId).map(n => [n.clientId!, n]));

            const toUpdate: Notification[] = [];

            for (const r of remote) {
                // Respetar Tombstones (Evitar resurrección)
                if (await this.offlineAdapter.isDeleted(userId, r.id)) continue;
                if (r.clientId && await this.offlineAdapter.isDeleted(userId, r.clientId)) continue;

                const l = localById.get(r.id) || (r.clientId ? localByClientId.get(r.clientId) : undefined);

                if (!l) {
                    toUpdate.push({ ...r, updatedAt: r.updatedAt || new Date(this.getTrustedNow()).toISOString() });
                    continue;
                }

                // Lógica LWW determinista con TimeService
                const isIdUpgrade = l.id.startsWith('local-') && !r.id.startsWith('local-');
                const remoteIsNewer = new Date(r.updatedAt || 0) > new Date(l.updatedAt);

                if (isIdUpgrade || (remoteIsNewer && l.status !== r.status)) {
                    if (isIdUpgrade) await this.offlineAdapter.delete(userId, l.id);
                    toUpdate.push({ ...r, updatedAt: r.updatedAt || new Date(this.getTrustedNow()).toISOString() });
                }
            }

            if (toUpdate.length > 0) {
                await this.offlineAdapter.saveBatch(userId, toUpdate);
            }
        } catch (error) {
            log.warn('Reconciliation failed', error);
        }
    }

    async addNotification(data: Omit<Notification, 'id' | 'createdAt' | 'status' | 'updatedAt'>): Promise<Notification> {
        const userId = await this.getUserId();
        const now = new Date(this.getTrustedNow()).toISOString();
        const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const notification: Notification = {
            ...data,
            id: `local-${clientId}`,
            clientId,
            createdAt: now,
            updatedAt: now,
            status: 'pending',
            userId
        };

        // Guardado Atómico: SSOT + Queue
        await this.offlineAdapter.save(userId, notification);
        await this.offlineAdapter.enqueueAction(userId, { type: 'ADD', payload: notification });
        // NOTA: No llamamos syncWorker.triggerSync() aquí para evitar timeouts.
        // La sincronización será manejada por place-bet.flow.ts que ya llama a syncWorker.triggerSync()

        return notification;
    }

    async markAsRead(id: string): Promise<Notification> {
        const userId = await this.getUserId();
        const now = new Date(this.getTrustedNow()).toISOString();

        await this.offlineAdapter.updateStatus(userId, id, 'read', now);
        // Encolar acción de sync persistente
        await this.offlineAdapter.enqueueAction(userId, { type: 'MARK_READ', payload: id });
        syncWorker.triggerSync();

        const updated = await this.offlineAdapter.getById(userId, id);
        if (!updated) throw new Error('NOT_FOUND');
        return updated;
    }

    async markAllAsRead(): Promise<void> {
        const userId = await this.getUserId();
        const local = await this.offlineAdapter.getAll(userId);
        const pending = local.filter(n => n.status === 'pending');
        if (pending.length === 0) return;

        const now = new Date(this.getTrustedNow()).toISOString();
        await Promise.all(pending.map(n => this.offlineAdapter.updateStatus(userId, n.id, 'read', now)));

        await this.offlineAdapter.enqueueAction(userId, { type: 'MARK_ALL_READ', payload: null });
        syncWorker.triggerSync();
    }

    async deleteNotification(id: string): Promise<void> {
        const userId = await this.getUserId();
        await this.offlineAdapter.delete(userId, id);
        await this.offlineAdapter.markAsDeleted(userId, id);
        await this.offlineAdapter.enqueueAction(userId, { type: 'DELETE', payload: id });
        syncWorker.triggerSync();
    }

    getStreamUrl(token: string): string {
        const settings = require('@/config/settings').default;
        return `${settings.api.baseUrl}/notifications/stream/?token=${encodeURIComponent(token)}`;
    }

    isReady(): boolean { return true; }
}
