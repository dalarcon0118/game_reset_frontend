import { Model } from './model';
import { SubDescriptor, Sub } from '@core/tea-utils';
import { Msg, SYSTEM_READY as SYSTEM_READY_MSG } from './msg';
import { DASHBOARD_FILTER_CHANGED, SYSTEM_READY } from '@/config/signals';

export const subscriptions = (model: Model): SubDescriptor<Msg> => {
    // 1. Escucha señales globales para cambios de filtros
    const filterSub = Sub.receiveMsg(
        DASHBOARD_FILTER_CHANGED,
        (filter, dispatch) => {
            dispatch({ type: 'STATUS_FILTER_CHANGED', filter });
        },
        'listero-dashboard-filter-sync'
    );

    // 3. Escucha la señal global SYSTEM_READY emitida por el CoreModule
    const systemReadySub = Sub.receiveMsg(
        SYSTEM_READY,
        (payload, dispatch) => {
            dispatch(SYSTEM_READY_MSG({ date: payload.date }));
        },
        'listero-dashboard-system-ready'
    );

    // 4. Sincronización con el estado isSystemReady del CoreModule (Idempotencia)
    // Esto previene perder la señal si el mantenimiento terminó antes de que el Dashboard montara.
    const coreReadySub = Sub.watchStore(
        'Core',
        (state: any) => state?.model?.isSystemReady ?? false,
        (isReady) => isReady
            ? SYSTEM_READY_MSG({ date: new Date().toISOString().split('T')[0] })
            : { type: 'NONE' },
        'listero-dashboard-core-ready-sync'
    );

    return Sub.batch([filterSub, systemReadySub, coreReadySub]);
};
