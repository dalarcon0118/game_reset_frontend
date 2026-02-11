import { singleton, Return } from '@/shared/core/return';
import { Sub } from '@/shared/core/sub';
import { Model } from './model';
import { Msg } from './msg';
import { calculateSummary } from './summary.utils';
import { initialModel } from './initial.types';
import { featureRegistry } from './update.registry';

export function update(model: Model, msg: Msg): Return<Model, Msg> {
    const feature = featureRegistry[msg.type];

    if (!feature) {
        console.warn('Unhandled message type:', msg.type);
        return singleton(model);
    }

    const payload = (msg as any).payload;
    const updateResult = feature.update(model, payload);

    // If it's a Core update, it already returns the global Msg type
    if (feature.isCore) {
        return updateResult as Return<Model, Msg>;
    }

    // For other features, we need to map the sub-message back to the global Msg
    // and optionally calculate the summary
    let nextModel = updateResult.model;

    if (feature.requiresSummary) {
        nextModel = {
            ...nextModel,
            summary: calculateSummary(nextModel)
        };
    }

    // We use Return helper to reconstruct the return with the mapped command
    return Return.singleton((_: any) => nextModel).andMapCmd(
        feature.wrapper,
        updateResult
    );
}

export function init(): Return<Model, Msg> {
    return singleton(initialModel);
}

export function subscriptions(model: Model) {
    return Sub.none();
}
