import { Model } from './model';
import { SubDescriptor, Sub } from '@core/tea-utils';
import { Msg, SYSTEM_READY as SYSTEM_READY_MSG } from './msg';
import { DASHBOARD_FILTER_CHANGED, SYSTEM_READY, DASHBOARD_RULES_CLICKED, DASHBOARD_REWARDS_CLICKED, DASHBOARD_REFRESH_CLICKED } from '@/config/signals';

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

    // 4. Sincronización con el estado isSystemReady del CoreModule (Idempotencia)
    // Esto previene perder la señal si el mantenimiento terminó antes de que el Dashboard montara.
    const coreReadySub = Sub.watchStore(
        'Core',
        (state: any) => state?.isSystemReady ?? state?.model?.isSystemReady ?? false,
        (isReady) => isReady
            ? SYSTEM_READY_MSG({ date: new Date().toISOString().split('T')[0] })
            : { type: 'NONE' },
        'listero-dashboard-core-ready-sync'
    );

    return Sub.batch([filterSub, rulesSub, rewardsSub, refreshSub, systemReadySub, coreReadySub]);
};
