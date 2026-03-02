import { createElmStore } from '@/shared/core/engine';
import { effectHandlers } from '@/shared/core/effect_handlers';
import { createLoggerMiddleware } from '@/shared/core/middlewares/logger.middleware';
import { updateFeature } from './feature.update';
import {
    LoteriaFeatureModel,
    FeatureMsg,
    initialEditSession,
    initialListSession,
    initialEntrySession,
    initialManagementSession,
    initialRulesSession,
    initialRulesCache,
} from './feature.types';
import { initialLoteriaState } from '../loteria/loteria.types';
import { RemoteData } from '@/shared/core/remote.data';
import { Cmd } from '@/shared/core/cmd';
import { Sub } from '@/shared/core/sub';

// ============================================================================
// Initial Model (Fully Internalized)
// ============================================================================

export const initialModel: LoteriaFeatureModel = {
    currentDrawId: null,
    drawTypeCode: RemoteData.notAsked(),
    isEditing: false,
    structureId: null, // Se establecerá desde el contexto de autenticación
    summary: {
        loteriaTotal: 0,
        hasBets: false,
        isSaving: false,
        error: null,
        pendingReceiptCode: null,
    },
    loteriaSession: initialLoteriaState,
    editSession: initialEditSession,
    listSession: initialListSession,
    entrySession: initialEntrySession,
    managementSession: initialManagementSession,
    rulesSession: initialRulesSession,
    rules: initialRulesCache,
};

const init = (params?: Partial<LoteriaFeatureModel>): [LoteriaFeatureModel, Cmd] => {
    return [
        { ...initialModel, ...params },
        Cmd.none
    ];
};

const update = (model: LoteriaFeatureModel, msg: FeatureMsg) => updateFeature(model, msg);

const subscriptions = (_model: LoteriaFeatureModel) => Sub.none();

export const useLoteriaStore = createElmStore<LoteriaFeatureModel, FeatureMsg>(
    init,
    update,
    effectHandlers as any,
    // @ts-ignore
    subscriptions,
    [createLoggerMiddleware("BET_LOTERIA")]
);

export const selectLoteriaModel = (state: any) => state.model;
export const selectDispatch = (state: { dispatch: (msg: FeatureMsg) => void }) => state.dispatch;
