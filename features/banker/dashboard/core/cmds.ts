import { Cmd, RemoteDataHttp } from '@core/tea-utils';
import { routes } from '@/config/routes';
import { structureRepository } from '@/shared/repositories/structure';
import { Msg } from './msg';

/**
 * 🛠️ DASHBOARD COMMANDS
 * Centraliza todas las intenciones de efectos secundarios del Dashboard.
 * Sigue el patrón TEA: Son datos declarativos, no ejecución imperativa.
 */
export const Cmds = {
    // 🌐 HTTP COMMANDS
    fetchDashboardData: (structureId: string | null): Cmd => {
        if (!structureId) {
            return Cmd.ofMsg({ type: 'ERROR_OCCURRED', error: 'Missing structureId' });
        }
        
        const id = Number(structureId);
        
        return Cmd.batch([
            RemoteDataHttp.fetch(
                () => structureRepository.getChildren(id),
                (webData) => ({ type: 'AGENCIES_RECEIVED', webData })
            ),
            RemoteDataHttp.fetch(
                () => structureRepository.getSummary(id),
                (webData) => ({ type: 'SUMMARY_RECEIVED', webData })
            )
        ]);
    },

    // 📍 NAVIGATION COMMANDS
    navigateToAgency: (agencyId: number): Cmd =>
        Cmd.navigate({
            pathname: routes.banker.drawer.screen,
            params: { id: agencyId }
        }),

    navigateToRules: (agencyId: number): Cmd =>
        Cmd.navigate({
            pathname: routes.banker.rules.screen,
            params: { id_structure: agencyId }
        }),

    navigateToList: (agencyId: number): Cmd =>
        Cmd.navigate({
            pathname: routes.banker.listerias.screen,
            params: { id_structure: agencyId }
        }),

    navigateToSettings: (): Cmd =>
        Cmd.navigate(routes.banker.settings.screen),

    navigateToNotifications: (): Cmd =>
        Cmd.navigate('/notifications')
};
