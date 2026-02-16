import { singleton, Return } from '@/shared/core/return';
import { Sub } from '@/shared/core/sub';
import { Model } from './model';
import { Msg } from './msg';
import { calculateSummaryFromData, initialSummary } from './summary.utils';
import { initialModel } from './initial.types';
import { featureRegistry } from './update.registry';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('BETS_CORE');

/**
 * Selector to determine which data source to use for summary calculation
 */
const getSummaryData = (model: Model) => {
    if (model.isEditing) {
        return model.entrySession;
    }
    return model.listSession.remoteData.type === 'Success'
        ? model.listSession.remoteData.data
        : null;
};

export function update(model: Model, msg: Msg): Return<Model, Msg> {
    const feature = featureRegistry[msg.type];

    if (!feature) {
        log.warn('Unhandled message type', { type: msg.type });
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
        const dataSource = getSummaryData(nextModel);
        const isSaving = nextModel.managementSession.saveStatus.type === 'Loading';

        nextModel = {
            ...nextModel,
            summary: dataSource
                ? calculateSummaryFromData(dataSource, isSaving)
                : { ...initialSummary, isSaving }
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
