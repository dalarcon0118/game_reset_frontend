import { createElmStore } from '@/shared/core/engine/engine';
import { Cmd, Sub } from '@/shared/core/tea-utils';
import { updateFeature } from './feature.update';
import { LoteriaFeatureModel, FeatureMsg } from './feature.types';
import { initialModel } from './feature.initial';

// ============================================================================
// Initial Model (Re-exported from feature.initial to break circular dependency)
// ============================================================================

export { initialModel } from './feature.initial';

const init = (params?: Partial<LoteriaFeatureModel>): [LoteriaFeatureModel, Cmd] => {
    return [
        { ...initialModel, ...params },
        Cmd.none
    ];
};

const update = (model: LoteriaFeatureModel, msg: FeatureMsg) => updateFeature(model, msg);

const subscriptions = (_model: LoteriaFeatureModel) => Sub.none();

export const useLoteriaStore = createElmStore<LoteriaFeatureModel, FeatureMsg>({
    initial: init,
    update,
    subscriptions
});

export const selectLoteriaModel = (state: { model: LoteriaFeatureModel }) => state.model;
export const selectDispatch = (state: { dispatch: (msg: FeatureMsg) => void }) => state.dispatch;
