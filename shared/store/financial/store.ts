import { createTEAModule } from '@core/engine';
import { Model, initialModel } from './model';
import { Msg } from './msg';
import { update } from './update';
import { Sub } from '@core/tea-utils';
import { useDrawersStore } from '@/features/colector/drawers/core/store';
import { useListeriasStore } from '@/features/banker/listerias/core/store';

export const subscriptions = (model: Model) => {
    // Watch Colector Dashboard children to sync financial data
    /* TODO: Restore when dashboard store is accessible globally
    const dashboardSub = Sub.watchStore(
        useDashboardStore,
        (state: any) => {
            const model = state?.model ?? state;
            const children = model?.children;
            if (children?.type === 'Success') {
                return JSON.stringify(children.data.map((child: any) => child.id));
            }
            return '[]';
        },
        (nodeIdsJson) => {
            const nodeIds = JSON.parse(nodeIdsJson);
            return { type: 'SYNC_NODES', nodeIds };
        },
        'financial-sync-colector-dashboard'
    );
    */

    // Watch Drawers list to sync financial data for draws
    const drawersSub = Sub.watchStore(
        useDrawersStore,
        (state: any) => {
            const model = state?.model ?? state;
            const details = model?.details;
            if (details?.type === 'Success' && details.data?.draws) {
                return JSON.stringify(details.data.draws.map((draw: any) => draw.draw_id));
            }
            return '[]';
        },
        (drawIdsJson) => {
            const drawIds = JSON.parse(drawIdsJson);
            return { type: 'SYNC_DRAWS', drawIds };
        },
        'financial-sync-colector-drawers'
    );

    // Watch Banker Dashboard agencies to sync financial data
    /* TODO: Restore when dashboard store is accessible globally
    const bankerDashboardSub = Sub.watchStore(
        useBankerDashboardStore,
        (state: any) => {
            const model = state?.model ?? state;
            const agencies = model?.agencies;
            if (agencies?.type === 'Success') {
                return JSON.stringify(agencies.data.map((agency: any) => agency.id));
            }
            return '[]';
        },
        (nodeIdsJson) => {
            const nodeIds = JSON.parse(nodeIdsJson);
            return { type: 'SYNC_NODES', nodeIds };
        },
        'financial-sync-banker-dashboard'
    );
    */

    // Watch Banker Listerias list to sync financial data
    const bankerListeriasSub = Sub.watchStore(
        useListeriasStore,
        (state: any) => {
            const model = state?.model ?? state;
            const listerias = model?.listerias;
            if (listerias?.type === 'Success') {
                return JSON.stringify(listerias.data.map((listeria: any) => listeria.id));
            }
            return '[]';
        },
        (nodeIdsJson) => {
            const nodeIds = JSON.parse(nodeIdsJson);
            return { type: 'SYNC_NODES', nodeIds };
        },
        'financial-sync-banker-listerias'
    );

    return Sub.batch([
        // dashboardSub,
        drawersSub,
        // bankerDashboardSub,
        bankerListeriasSub
    ]);
};

export const FinancialModule = createTEAModule({
    name: 'Financial',
    initial: initialModel,
    update,
    subscriptions,
});

export const useFinancialStore = FinancialModule.useStore;

// Selectors
export const selectFinancialModel = (state: { model: Model }) => state.model;
export const selectFinancialDispatch = (state: { dispatch: (msg: Msg) => void }) => state.dispatch;
export const selectNodeFinancialSummary = (nodeId: number) => (state: { model: Model }) => state.model.summaries[nodeId];
