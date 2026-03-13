import { Model } from './model';
import { SubDescriptor, Sub } from '@core/tea-utils';
import { Msg } from './msg';
import { DASHBOARD_FILTER_CHANGED } from '@/config/signals';

export const subscriptions = (model: Model): SubDescriptor<Msg> => {
    // Sincronización automática con el store de Auth para cambios de usuario
    // Usamos el ID del módulo registrado en StoreRegistry para mantener la pureza TEA
    const authSub = Sub.watchStore(
        'AuthModuleV1',
        (state: any) => {
            const user = state?.model?.user ?? state?.user;
            // Transformar User a DashboardUser extrayendo structureId del objeto nested
            return user ? {
                ...user,
                structureId: user.structure?.id,
                commissionRate: user.structure?.commission_rate ?? 0
            } : null;
        },
        (user) => ({ type: 'AUTH_USER_SYNCED', user }),
        'listero-dashboard-auth-sync'
    );

    // Escucha señales globales para cambios de filtros (Pub/Sub desacoplado)
    const filterSub = Sub.receiveMsg(
        DASHBOARD_FILTER_CHANGED,
        (filter, dispatch) => {
            dispatch({ type: 'STATUS_FILTER_CHANGED', filter });
        },
        'listero-dashboard-filter-sync'
    );

    return Sub.batch([authSub, filterSub]);
};
