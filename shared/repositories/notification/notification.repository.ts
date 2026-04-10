import { INotificationRepository, Notification } from './notification.ports';
import { NotificationApi } from './api/api';
import { NotificationOfflineAdapter } from './adapters/notification.offline.adapter';
import { isServerReachable } from '@/shared/utils/network';
import { logger } from '@/shared/utils/logger';
import { AuthRepository } from '../auth';
import { TimerRepository } from '@/shared/repositories/system/time';
import { syncWorker } from '@core/offline-storage/instance';
import { NotificationSyncListener } from './sync/notification.sync.listener';
import { NotificationSyncStrategy } from './sync/notification.sync.strategy';
import { generateId } from '@/shared/utils/id';

const log = logger.withTag('NotificationRepository');

/**
 * 🏛️ NOTIFICATION REPOSITORY (Robust SSOT & Offline-First)
 * 
 * Implementación de grado industrial:
 * - Determinismo: Usa TimeService como fuente única de tiempo.
 * - Resiliencia: Delega sincronización al SyncWorker global (con reintentos).
 * - Integridad: Reconciliación LWW con Tombstones para evitar "resurrecciones".
 * - Higiene: Mantenimiento automático de 3 días.
 * - Anti-Ciclo: Flag isRefreshing para prevenir ciclos infinitos.
 */
export class NotificationRepository implements INotificationRepository {
    private static syncListenerStarted = false;
    private static strategyRegistered = false;
    private syncListener: NotificationSyncListener;
    private isRefreshing = false;
    private lastRefreshTime = 0;
    private lastCleanupTime = 0;
    private readonly REFRESH_DEBOUNCE_MS = 60000; // Aumentado a 60 segundos para evitar saturar el backend
    private readonly CLEANUP_INTERVAL_MS = 60000; // 1 minuto entre limpiezas

    constructor(
        private offlineAdapter: NotificationOfflineAdapter = new NotificationOfflineAdapter(),
        private api: typeof NotificationApi = NotificationApi
    ) {
        this.syncListener = new NotificationSyncListener();
        if (!NotificationRepository.syncListenerStarted) {
            this.syncListener.start();
            NotificationRepository.syncListenerStarted = true;
        }

        // Registrar estrategia de sincronización para el worker global
        if (!NotificationRepository.strategyRegistered) {
            syncWorker.registerStrategy('notification', new NotificationSyncStrategy());
            NotificationRepository.strategyRegistered = true;
        }
    }

    private getTrustedNow(): number {
        try {
            return TimerRepository.getTrustedNow(Date.now());
        } catch (error) {
            log.warn('TimerRepository unavailable, falling back to Date.now()', error);
            return Date.now();
        }
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
            const notifications = await this.offlineAdapter.getAll(userId);
            return notifications.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        } catch (error) {
            log.error('Failed to get notifications from SSOT', error);
            return [];
        }
    }

    private async runBackgroundTasks(userId: string): Promise<void> {
        // Anti-ciclo: Verificar debounce y flag de refreshing
        const now = Date.now();
        if (this.isRefreshing) {
            log.debug('Already refreshing, skipping background tasks');
            return;
        }
        if (now - this.lastRefreshTime < this.REFRESH_DEBOUNCE_MS) {
            log.debug(`Debounce active, skipping refresh (last: ${this.lastRefreshTime}, now: ${now})`);
            return;
        }

        this.isRefreshing = true;
        this.lastRefreshTime = now;

        try {
            // 1. Reconciliación con el servidor
            await this.syncRemoteToLocal(userId);

            // 2. Higiene: Limpieza de antiguos (> 3 días)
            await this.cleanupOldNotifications(userId);
        } finally {
            this.isRefreshing = false;
        }
    }

    private async cleanupOldNotifications(userId: string): Promise<void> {
        const now = Date.now();

        if (now - this.lastCleanupTime < this.CLEANUP_INTERVAL_MS) {
            log.debug(`Cleanup interval not reached, skipping (last: ${this.lastCleanupTime}, now: ${now})`);
            return;
        }

        this.lastCleanupTime = now;

        const local = await this.offlineAdapter.getAll(userId);
        const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;
        const trustedNow = this.getTrustedNow();

        const toDelete = local.filter(n => {
            const age = trustedNow - new Date(n.createdAt).getTime();
            const isOldRead = age > THREE_DAYS_MS && n.status === 'read';
            const isStalePending = age > ONE_DAY_MS && n.status === 'pending';
            return isOldRead || isStalePending;
        });

        if (toDelete.length > 0) {
            log.debug(`Janitor: cleaning ${toDelete.length} expired notifications`);
            await Promise.all(toDelete.map(n => this.deleteNotification(n.id)));
        } else {
            log.debug('Janitor: no expired notifications to clean');
        }
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

            // Solo guardar si hay cambios reales para evitar eventos innecesarios
            if (toUpdate.length > 0) {
                log.debug(`Syncing ${toUpdate.length} notifications to local storage`);
                await this.offlineAdapter.saveBatch(userId, toUpdate);
            } else {
                log.debug('No notification changes to sync');
            }
        } catch (error) {
            log.warn('Reconciliation failed', error);
        }
    }

    async addNotification(data: Omit<Notification, 'id' | 'createdAt' | 'status' | 'updatedAt'>, externalKey?: string): Promise<Notification> {
        const userId = await this.getUserId();

        if (externalKey) {
            const existing = await this.offlineAdapter.getByExternalKey(userId, externalKey);
            if (existing) {
                log.debug(`Notificación duplicada omitida: ${externalKey}`);
                return existing;
            }
        }

        const now = new Date(this.getTrustedNow()).toISOString();
        const clientId = `client-${generateId()}`;

        const notification: Notification = {
            ...data,
            id: `local-${clientId}`,
            clientId,
            externalKey,
            createdAt: now,
            updatedAt: now,
            status: 'pending',
            userId
        };

        await this.offlineAdapter.save(userId, notification);
        await this.offlineAdapter.enqueueAction(userId, { type: 'ADD', payload: notification });

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

    async clearAllNotifications(): Promise<void> {
        const userId = await this.getUserId();
        const local = await this.offlineAdapter.getAll(userId);

        // FASE 2 FIX: Marcar todos como eliminados (Tombstones) para evitar "resurrección" 
        // durante el siguiente sync mientras el backend procesa el borrado.
        await Promise.all(local.map(n => this.offlineAdapter.markAsDeleted(userId, n.id)));

        // 2. Limpiar storage local
        await this.offlineAdapter.clearAll(userId);

        // 3. Enviar a la cola de sync
        await this.offlineAdapter.enqueueAction(userId, { type: 'CLEAR_ALL', payload: null });
        syncWorker.triggerSync();
    }

    async forceSyncFromBackend(): Promise<Notification[]> {
        const userId = await this.getUserId();
        if (!(await isServerReachable())) {
            log.warn('Force sync skipped: server unreachable');
            return [];
        }

        try {
            const remote = await this.api.getNotifications() as Notification[];
            await this.offlineAdapter.saveBatch(userId, remote);
            log.info(`Force sync complete: ${remote.length} notifications fetched`);
            return remote;
        } catch (error) {
            log.error('Force sync failed', error);
            return [];
        }
    }

    getStreamUrl(token: string): string {
        const settings = require('@/config/settings').default;
        return `${settings.api.baseUrl}/notifications/stream/?token=${encodeURIComponent(token)}`;
    }

    isReady(): boolean { return true; }
}
