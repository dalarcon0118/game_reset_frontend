import { createElmStore } from '@/shared/core/engine';
import { effectHandlers } from '@/shared/core/effect_handlers';
import { createLoggerMiddleware } from '@/shared/core/middlewares/logger.middleware';
import { AppKernel } from '@/shared/core/architecture/kernel';
import { Model } from '../model';
import { Msg } from './msg';
import { initialModel } from '../initial.types';

// Lazily retrieve the Gateway Feature to avoid initialization order issues
const getGatewayFeature = () => {
    const feature = AppKernel.getFeature('BET_WORKSPACE');
    if (!feature) {
        // Return null instead of throwing to allow safe module evaluation
        // The store must be re-initialized after bootstrap
        return null;
    }
    return feature;
};

// Wrapper functions to delegate to the feature at runtime
const init = (_params?: any): any => {
    const feature = getGatewayFeature();
    if (!feature) {
        // Return initialModel instead of empty object to ensure all properties exist
        // This will be replaced when bootstrap calls init() again
        return [initialModel, null];
    }
    return feature.init();
};

const update = (model: Model, msg: Msg): any => {
    const feature = getGatewayFeature();
    if (!feature) {
        console.warn('BET_WORKSPACE feature missing during update. Msg:', msg);
        return [model, null];
    }
    return feature.update(msg, model);
};

const subscriptions = (model: Model) => {
    const feature = getGatewayFeature();
    return feature?.subscriptions?.(model) ?? null;
};

export const useBetsStore = createElmStore<Model, Msg>(
    init,
    update,
    effectHandlers as any,
    subscriptions,
    [createLoggerMiddleware()]
);

// Selectors
export const selectBetsModel = (state: any) => state.model;
export const selectDispatch = (state: { dispatch: (msg: Msg) => void }) => state.dispatch;
export const selectInit = (state: { init: (params?: any) => void }) => state.init;
