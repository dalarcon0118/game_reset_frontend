import { createTEAModule, defineTeaModule } from '@core/engine/tea_module';
import { Model, BetSummary, ListData } from '../model';
import { update, Msg } from './update';
import { initialCreateState } from '../create/core/types';
import { initialEditState } from '../edit/core/types';
import { initialRulesModel } from '../rules/core/model';
import { initialListState } from '../list/core/types';
import { ManagementMsgType, initialManagementState } from '../management/core/types';
import { initialLoteriaState } from '../../bet-loteria/loteria/loteria.types';
import { initialVoucherModel } from '../success/core/domain/success.types';
import { initialParletState, initialCentenaState } from '../../bet-bolita/domain/models/bolita.initial';
import { initialRewardsModel } from '../rewards/core/model';
import { RemoteData, singleton, ret, Cmd } from '@core/tea-utils';
import { FETCH_RULES_REQUESTED } from '../rules/core/types';

/**
 * 📝 BET WORKSPACE MODULE PARAMS
 * Define what BetWorkspace needs to start.
 */
export interface BetWorkspaceParams {
    drawId: string;
    mode: 'entry' | 'list';
    title?: string;
}

const initialSummary: BetSummary = {
    loteriaTotal: 0,
    parletsTotal: 0,
    centenasTotal: 0,
    grandTotal: 0,
    hasBets: false,
    isSaving: false,
    count: 0,
};

const initialListData: ListData = {
    parlets: [],
    centenas: [],
    loteria: [],
    fijosCorridos: [],
};

const initialState: Model = {
    // UiState
    error: null,

    // Core data
    currentDrawId: null,
    drawTypeCode: RemoteData.notAsked(),
    isEditing: false,
    summary: initialSummary,
    navigation: null,

    // Sessions
    createSession: initialCreateState,
    editSession: initialEditState,
    parletSession: initialParletState,
    centenaSession: initialCentenaState,
    rulesSession: initialRulesModel,
    loteriaSession: initialLoteriaState,
    listSession: initialListState,
    entrySession: initialListData,
    managementSession: initialManagementState,
    successSession: initialVoucherModel,

    // Cache
    rewards: initialRewardsModel,
};

/**
 * 🏗️ BET WORKSPACE MODULE DEFINITION
 */
const workspaceDefinition = defineTeaModule<Model, Msg>({
    name: 'BetWorkspace',
    initial: (params: BetWorkspaceParams) => {
        if (!params || !params.drawId) {
            return singleton(initialState);
        }

        const model: Model = {
            ...initialState,
            currentDrawId: params.drawId,
            isEditing: params.mode === 'entry',
            rulesSession: {
                ...initialState.rulesSession,
                currentDrawId: params.drawId
            }
        };

        const commands = [
            // Trigger management initialization
            Cmd.ofMsg({
                type: 'MANAGEMENT',
                payload: {
                    type: ManagementMsgType.INIT,
                    drawId: params.drawId,
                    fetchExistingBets: params.mode === 'list',
                    isEditing: params.mode === 'entry'
                }
            } as Msg),
            // Trigger rules fetch
            Cmd.ofMsg({
                type: 'RULES',
                payload: FETCH_RULES_REQUESTED({ drawId: params.drawId })
            } as Msg)
        ];

        return ret(model, Cmd.batch(commands));
    },
    update: (model, msg) => update(msg, model)
});

/**
 * 🏪 BET WORKSPACE MODULE INSTANCE
 */
export const BetWorkspaceModule = createTEAModule(workspaceDefinition);

// Public API Hooks
export const BetWorkspaceProvider = BetWorkspaceModule.Provider;
export const useBetWorkspaceStore = BetWorkspaceModule.useStore;
export const useBetWorkspaceDispatch = BetWorkspaceModule.useDispatch;
export const useBetWorkspaceStoreApi = BetWorkspaceModule.useStoreApi;

// Optimized Model Hook
export const useBetWorkspaceModel = () => useBetWorkspaceStore(s => s.model);

/**
 * 🔄 LEGACY COMPATIBILITY
 */
export const selectBetWorkspaceModel = (state: { model: Model }) => state.model;
export const selectDispatch = (state: { dispatch: (msg: Msg) => void }) => state.dispatch;
