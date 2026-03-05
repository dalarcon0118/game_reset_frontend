import { Model } from './model';
import { SubDescriptor, Sub } from '@/shared/core/sub';
import { Msg } from './msg';
import { useAuthStore } from '@features/auth';
import { pluginEventBus } from '@/shared/core/plugins/plugin.event_bus';

export const subscriptions = (model: Model): SubDescriptor<Msg> => {
    // Sincronización automática con el store de Auth para cambios de usuario
    const authSub = Sub.watchStore(
        useAuthStore,
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

    // Escucha eventos de filtrado desde los plugins (ej: FiltersPlugin)
    const filterSub = Sub.custom<Msg>((dispatch) => {
        return pluginEventBus.subscribe('dashboard:filter_changed', (filter) => {
            dispatch({ type: 'STATUS_FILTER_CHANGED', filter });
        });
    }, 'listero-dashboard-filter-sync');

    return Sub.batch([authSub, filterSub]);
};
