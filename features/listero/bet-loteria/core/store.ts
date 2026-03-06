import { createElmStore } from '@/shared/core/engine/engine';
import { effectHandlers } from '@/shared/core/tea-utils/effect_handlers';
import { createLoggerMiddleware } from '@/shared/core/middlewares/logger.middleware';
import { updateFeature } from './feature.update';
import { LoteriaFeatureModel, FeatureMsg } from './feature.types';
import { initialModel } from './feature.initial';
import { Cmd } from '@/shared/core/tea-utils/cmd';
import { Sub } from '@/shared/core/tea-utils/sub';

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
