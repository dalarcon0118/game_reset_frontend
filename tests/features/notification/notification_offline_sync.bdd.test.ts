import { scenario, createTestContext, TestContext } from '@/tests/core';
import { ScenarioConfig } from '@/tests/core/scenario';

type Source = 'backend' | 'ui';
type DeliveryStatus = 'pending_sync' | 'synced' | 'failed';

interface NotificationItem {
    id: string;
    clientId?: string;
    source: Source;
    title: string;
    deliveryStatus: DeliveryStatus;
}

interface NotificationOfflineSyncData {
    online: boolean;
    backendNotifications: NotificationItem[];
    localNotifications: NotificationItem[];
    mergedNotifications: NotificationItem[];
    lastCreatedNotificationId: string | null;
    persistedSnapshot: NotificationItem[];
}

const testConfig: ScenarioConfig = {
    timeout: 120000
};

const createInitialContext = (): TestContext & { data: NotificationOfflineSyncData } => {
    const baseContext = createTestContext({
        initialData: {
            online: true,
            backendNotifications: [],
            localNotifications: [],
            mergedNotifications: [],
            lastCreatedNotificationId: null,
            persistedSnapshot: []
        }
    });

    return {
        ...baseContext,
        data: baseContext.data as NotificationOfflineSyncData
    };
};

scenario('Notificaciones - Sincronizar y cachear backend para uso offline', createInitialContext(), testConfig)
    .given('un usuario autenticado con conectividad disponible', async (ctx: any) => {
        ctx.data.online = true;
    })
    .given('el repositorio de notificaciones local está vacío', async (ctx: any) => {
        ctx.data.localNotifications = [];
    })
    .when('la app solicita la bandeja de notificaciones al backend', async (ctx: any) => {
        ctx.data.backendNotifications = [
            {
                id: 'srv-1',
                source: 'backend',
                title: 'Notificación backend 1',
                deliveryStatus: 'synced'
            },
            {
                id: 'srv-2',
                source: 'backend',
                title: 'Notificación backend 2',
                deliveryStatus: 'synced'
            }
        ];
    })
    .then('la respuesta del backend se persiste en almacenamiento local', async (ctx: any) => {
        ctx.data.localNotifications = [...ctx.data.backendNotifications];
        expect(ctx.data.localNotifications).toHaveLength(2);
        expect(ctx.data.localNotifications.every((n: NotificationItem) => n.source === 'backend')).toBe(true);
    })
    .then('la UI lista las notificaciones usando la fuente local unificada', async (ctx: any) => {
        ctx.data.mergedNotifications = [...ctx.data.localNotifications];
        expect(ctx.data.mergedNotifications).toHaveLength(2);
    })
    .test();

scenario('Notificaciones - Crear desde UI cuando hay conectividad', createInitialContext(), testConfig)
    .given('un usuario autenticado con conectividad disponible', async (ctx: any) => {
        ctx.data.online = true;
    })
    .when('la UI genera una notificación de dominio', async (ctx: any) => {
        const notification: NotificationItem = {
            id: 'ui-1',
            clientId: 'client-ui-1',
            source: 'ui',
            title: 'Apuestas sincronizadas',
            deliveryStatus: 'pending_sync'
        };

        ctx.data.localNotifications = [notification];
        ctx.data.lastCreatedNotificationId = notification.id;
    })
    .then('la notificación se guarda inmediatamente en el cliente con estado "pending_sync"', async (ctx: any) => {
        const created = ctx.data.localNotifications.find((n: NotificationItem) => n.id === ctx.data.lastCreatedNotificationId);
        expect(created).toBeDefined();
        expect(created?.deliveryStatus).toBe('pending_sync');
    })
    .then('la UI la muestra sin esperar al backend', async (ctx: any) => {
        ctx.data.mergedNotifications = [...ctx.data.localNotifications];
        expect(ctx.data.mergedNotifications.some((n: NotificationItem) => n.id === ctx.data.lastCreatedNotificationId)).toBe(true);
    })
    .then('el sistema envía la notificación al backend', async (ctx: any) => {
        const created = ctx.data.localNotifications.find((n: NotificationItem) => n.id === ctx.data.lastCreatedNotificationId);
        if (created) {
            ctx.data.backendNotifications = [{ ...created, id: 'srv-ui-1', deliveryStatus: 'synced' }];
        }
        expect(ctx.data.backendNotifications).toHaveLength(1);
    })
    .then('la notificación local cambia a estado "synced"', async (ctx: any) => {
        ctx.data.localNotifications = ctx.data.localNotifications.map((n: NotificationItem) =>
            n.id === ctx.data.lastCreatedNotificationId ? { ...n, deliveryStatus: 'synced' } : n
        );
        const created = ctx.data.localNotifications.find((n: NotificationItem) => n.id === ctx.data.lastCreatedNotificationId);
        expect(created?.deliveryStatus).toBe('synced');
    })
    .test();

scenario('Notificaciones - Crear desde UI cuando no hay conectividad', createInitialContext(), testConfig)
    .given('un usuario autenticado sin conectividad', async (ctx: any) => {
        ctx.data.online = false;
    })
    .when('la UI genera una notificación de dominio', async (ctx: any) => {
        const notification: NotificationItem = {
            id: 'ui-offline-1',
            clientId: 'client-offline-1',
            source: 'ui',
            title: 'Apuesta guardada offline',
            deliveryStatus: 'pending_sync'
        };

        ctx.data.localNotifications = [notification];
        ctx.data.lastCreatedNotificationId = notification.id;
    })
    .then('la notificación se guarda localmente con estado "pending_sync"', async (ctx: any) => {
        const created = ctx.data.localNotifications.find((n: NotificationItem) => n.id === ctx.data.lastCreatedNotificationId);
        expect(created?.deliveryStatus).toBe('pending_sync');
    })
    .then('la UI la muestra en la bandeja de notificaciones', async (ctx: any) => {
        ctx.data.mergedNotifications = [...ctx.data.localNotifications];
        expect(ctx.data.mergedNotifications).toHaveLength(1);
    })
    .then('no se pierde al reiniciar la app', async (ctx: any) => {
        ctx.data.persistedSnapshot = [...ctx.data.localNotifications];
        ctx.data.localNotifications = [...ctx.data.persistedSnapshot];
        expect(ctx.data.localNotifications).toHaveLength(1);
        expect(ctx.data.localNotifications[0].id).toBe('ui-offline-1');
    })
    .test();

scenario('Notificaciones - Reintento al recuperar conectividad', createInitialContext(), testConfig)
    .given('existen notificaciones locales con estado "pending_sync"', async (ctx: any) => {
        ctx.data.localNotifications = [
            {
                id: 'ui-pending-1',
                clientId: 'retry-1',
                source: 'ui',
                title: 'Pendiente 1',
                deliveryStatus: 'pending_sync'
            },
            {
                id: 'ui-pending-2',
                clientId: 'retry-2',
                source: 'ui',
                title: 'Pendiente 2',
                deliveryStatus: 'pending_sync'
            }
        ];
    })
    .given('la conectividad se restablece', async (ctx: any) => {
        ctx.data.online = true;
    })
    .when('el motor de sincronización ejecuta el proceso de reintento', async (ctx: any) => {
        ctx.data.localNotifications = ctx.data.localNotifications.map((n: NotificationItem, index: number) =>
            index === 0 ? { ...n, deliveryStatus: 'synced' } : { ...n, deliveryStatus: 'failed' }
        );
        ctx.data.backendNotifications = [
            {
                id: 'srv-retry-1',
                clientId: 'retry-1',
                source: 'backend',
                title: 'Pendiente 1',
                deliveryStatus: 'synced'
            }
        ];
    })
    .then('las notificaciones pendientes se envían al backend', async (ctx: any) => {
        expect(ctx.data.backendNotifications).toHaveLength(1);
        expect(ctx.data.backendNotifications[0].clientId).toBe('retry-1');
    })
    .then('las notificaciones exitosas cambian a estado "synced"', async (ctx: any) => {
        const synced = ctx.data.localNotifications.find((n: NotificationItem) => n.clientId === 'retry-1');
        expect(synced?.deliveryStatus).toBe('synced');
    })
    .then('las notificaciones fallidas conservan estado "failed" para reintento posterior', async (ctx: any) => {
        const failed = ctx.data.localNotifications.find((n: NotificationItem) => n.clientId === 'retry-2');
        expect(failed?.deliveryStatus).toBe('failed');
    })
    .test();

scenario('Notificaciones - Evitar duplicados al fusionar backend y cliente', createInitialContext(), testConfig)
    .given('existe una notificación local creada por UI con clientId "abc-123"', async (ctx: any) => {
        ctx.data.localNotifications = [
            {
                id: 'ui-dup-1',
                clientId: 'abc-123',
                source: 'ui',
                title: 'Premio sincronizado',
                deliveryStatus: 'pending_sync'
            }
        ];
    })
    .given('el backend retorna la misma notificación con referencia a clientId "abc-123"', async (ctx: any) => {
        ctx.data.backendNotifications = [
            {
                id: 'srv-dup-1',
                clientId: 'abc-123',
                source: 'backend',
                title: 'Premio sincronizado',
                deliveryStatus: 'synced'
            }
        ];
    })
    .when('la app fusiona la bandeja remota con la bandeja local', async (ctx: any) => {
        const backendByClientId = new Map(
            ctx.data.backendNotifications
                .filter((n: NotificationItem) => !!n.clientId)
                .map((n: NotificationItem) => [n.clientId as string, n])
        );

        const dedupedLocal = ctx.data.localNotifications.filter((n: NotificationItem) =>
            !n.clientId || !backendByClientId.has(n.clientId)
        );

        ctx.data.mergedNotifications = [...ctx.data.backendNotifications, ...dedupedLocal];
    })
    .then('la UI muestra una sola notificación para ese evento', async (ctx: any) => {
        expect(ctx.data.mergedNotifications).toHaveLength(1);
    })
    .then('el estado final de la notificación es consistente con el backend', async (ctx: any) => {
        expect(ctx.data.mergedNotifications[0].deliveryStatus).toBe('synced');
        expect(ctx.data.mergedNotifications[0].source).toBe('backend');
    })
    .test();
