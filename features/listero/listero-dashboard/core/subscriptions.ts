import { Model } from './model';
import { SubDescriptor, Sub } from '@core/tea-utils';
import { Msg, TICK, SYSTEM_READY as SYSTEM_READY_MSG, EXTERNAL_BETS_CHANGED } from './msg';
import { adaptAuthUser } from './user.dto';
import { DASHBOARD_FILTER_CHANGED, SYSTEM_READY, DASHBOARD_RULES_CLICKED, DASHBOARD_REWARDS_CLICKED, DASHBOARD_REFRESH_CLICKED } from '@/config/signals';
import { settings } from '@/config/settings';
import { offlineEventBus } from '@core/offline-storage/instance';
import { DomainEvent } from '@core/offline-storage/types';

export const subscriptions = (model: Model): SubDescriptor<Msg> => {
    // 1. Escucha señales globales para cambios de filtros
    const filterSub = Sub.receiveMsg(
        DASHBOARD_FILTER_CHANGED,
        (filter, dispatch) => {
            dispatch({ type: 'STATUS_FILTER_CHANGED', filter });
        },
        'listero-dashboard-filter-sync'
    );

    // 2. Escucha señales para navegación de reglas
    const rulesSub = Sub.receiveMsg(
        DASHBOARD_RULES_CLICKED,
        (drawId, dispatch) => {
            dispatch({ type: 'RULES_CLICKED', drawId: String(drawId) });
        },
        'listero-dashboard-rules-sync'
    );

    // 3. Escucha señales para navegación de premios
    const rewardsSub = Sub.receiveMsg(
        DASHBOARD_REWARDS_CLICKED,
        (payload, dispatch) => {
            dispatch({ type: 'REWARDS_CLICKED', drawId: String(payload.id), title: payload.title });
        },
        'listero-dashboard-rewards-sync'
    );

    // 4. Escucha señales para refrescar datos
    const refreshSub = Sub.receiveMsg(
        DASHBOARD_REFRESH_CLICKED,
        (_, dispatch) => {
            dispatch({ type: 'REFRESH_CLICKED' });
        },
        'listero-dashboard-refresh-sync'
    );

    // 5. Escucha la señal global SYSTEM_READY emitida por el CoreModule
    const systemReadySub = Sub.receiveMsg(
        SYSTEM_READY,
        (payload, dispatch) => {
            dispatch(SYSTEM_READY_MSG({
                date: payload.date,
                structureId: payload.structureId,
                user: payload.user
            }));
        },
        'listero-dashboard-system-ready'
    );

    // 6. Sincronización con el estado isSystemReady del CoreModule (Idempotencia)
    // Esto previene perder la señal si el mantenimiento terminó antes de que el Dashboard montara.
    const coreReadySub = Sub.watchStore(
        'Core',
        (state: any) => {
            const isReady = state?.isSystemReady ?? state?.model?.isSystemReady ?? false;
            // Solo disparar si el sistema está listo y el dashboard aún no tiene su ID
            // O si el estado del dashboard es IDLE
            return isReady && (model.status.type === 'IDLE' || !model.userStructureId);
        },
        (shouldTrigger) => shouldTrigger
            ? SYSTEM_READY_MSG({ date: new Date().toISOString().split('T')[0] })
            : { type: 'NONE' },
        'listero-dashboard-core-ready-sync'
    );

    // 7. Sincronización con el perfil de usuario del AuthStore
    const authUserSub = Sub.watchStore(
        'Auth',
        (state: any) => state?.model?.user,
        (user) => ({ type: 'AUTH_USER_SYNCED', user: user ? adaptAuthUser(user) : null }),
        'listero-dashboard-auth-user-sync'
    );

    // 7b. Sincronización con el estado needs_pin_change del AuthStore
    // Evita cargar promociones si el usuario necesita cambiar su password
    const authNeedsPasswordChangeSub = Sub.watchStore(
        'Auth',
        (state: any) => state?.model?.needs_pin_change,
        (needsChange) => ({ type: 'NEEDS_PASSWORD_CHANGE', needsChange: needsChange ?? false }),
        'listero-dashboard-auth-needs-pin-change'
    );

    // 8. Timeout fallback: Si después de 8s el CoreModule no envía SYSTEM_READY,
    // forzamos la carga de datos usando fetchUserDataCmd (Bug 2 fix)
    const timeoutFallbackSub = model.status.type === 'IDLE'
        ? Sub.every(8000, SYSTEM_READY_MSG({ date: new Date().toISOString().split('T')[0] }), 'listero-dashboard-timeout-fallback')
        : Sub.none();

    // 9. Periodic data refresh (TICK) — only when dashboard is READY
    /*const tickSub = model.status.type === 'READY' && model.userStructureId
        ? Sub.every(30000, TICK(), 'listero-dashboard-tick')
        : Sub.none();*/

    // 9. SSE subscription for real-time financial updates — only when authenticated

    // 10. SSOT: Listen to offlineEventBus for sync completion events (not ENTITY_CHANGED to avoid loops)
    // SYNC_ITEM_SUCCESS/ERROR indicate external sync completed - safe to reload bets
    // ENTITY_CHANGED causes infinite loops because getBets flow publishes it internally
    const betsSyncSub = Sub.custom<Msg>(
        (dispatch) => {
            let debounceTimer: ReturnType<typeof setTimeout> | null = null;
            const DEBOUNCE_MS = 3000; // Aumentado de 1000ms a 3000ms para prevenir ANR por storm de peticiones

            const unsubscribe = offlineEventBus.subscribe((event: DomainEvent) => {
                const isBetSync = (event.type === 'SYNC_ITEM_SUCCESS' || event.type === 'SYNC_ITEM_ERROR') && event.entity === 'bet';
                if (isBetSync) {
                    if (debounceTimer) clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(() => {
                        dispatch(EXTERNAL_BETS_CHANGED());
                    }, DEBOUNCE_MS);
                }
            });
            return () => {
                if (debounceTimer) clearTimeout(debounceTimer);
                unsubscribe();
            };
        },
        'listero-dashboard-bets-sync-listener'
    );

    // 11. Periodic data refresh (TICK) — only when dashboard is READY

    return Sub.batch([filterSub, rulesSub, rewardsSub, refreshSub, systemReadySub, coreReadySub, authUserSub, authNeedsPasswordChangeSub, timeoutFallbackSub, betsSyncSub]);
};
