import { createElmStore } from '@/shared/core/engine';
import { Model, BetSummary, ListData } from '../model';
import { update, Msg } from './update';
import { initialCreateState } from '../create/core/types';
import { initialEditState } from '../edit/core/types';
import { initialRulesModel } from '../rules/core/model';
import { initialListState } from '../list/core/types';
import { initialManagementState } from '../management/core/types';
import { initialLoteriaState } from '../../bet-loteria/loteria/loteria.types';
import { initialVoucherModel } from '../success/core/domain/success.types';
import { initialParletState, initialCentenaState } from '../../bet-bolita/domain/models/bolita.initial';
import { RemoteData } from '@/shared/core/remote.data';
import { Return } from '@/shared/core/return';

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
    isSidebarOpen: false,
    activeTab: 'create',
    showDrawSelector: false,
    showRulesDrawer: false,

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
    rewardsCache: { rewards: RemoteData.notAsked() },
    rulesCache: { rules: RemoteData.notAsked() },
};

export const useBetWorkspaceStore = createElmStore<Model, Msg>(
    initialState,
    (model, msg) => update(msg, model),
    {
        // Add custom effect handlers if needed
    }
);
