
import { Feature } from '@/shared/core/architecture/interfaces';
import { Model } from './model';
import { initialModel } from './initial.types';
import { Msg } from './core/msg';
import { Cmd } from '@/shared/core/cmd';
import { match } from 'ts-pattern';
import { Return, singleton } from '@/shared/core/return';

// Logic imports
import { updateList } from './list/list.update';
import { updateSuccess } from './success/success.update';
import { updateRewardsRules } from './rewards/rewards.update';
import { updateCreate, initCreate } from './create/create.update';
import { updateEdit } from './edit/edit.update';
import { updateKeyboard } from './edit/keyboard.update';
import { updateUi } from './ui/ui.update';
import { updateManagement } from './management/management.update';
import { updateRules, initRules } from './rules/rules.update';

// External Logic imports
import { ExternalFeaturesGateway, ExternalFeaturesHandler } from './gateways/external.gateway';
import { ManagementMsgType } from './management/management.types';

// Summary utils
import { calculateSummaryFromData, initialSummary } from './summary.utils';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('BET_WORKSPACE');

/**
 * Helper to calculate summary based on current state
 */
const getSummaryData = (model: Model) => {
    if (model.isEditing) {
        return model.entrySession;
    }
    return model.listSession.remoteData.type === 'Success'
        ? model.listSession.remoteData.data
        : null;
};

const calculateSummary = (model: Model): Model => {
    const dataSource = getSummaryData(model);
    const isSaving = model.managementSession.saveStatus.type === 'Loading';

    return {
        ...model,
        summary: dataSource
            ? calculateSummaryFromData(dataSource, isSaving)
            : { ...initialSummary, isSaving }
    };
};

// Helper to normalize return types to [Model, Cmd]
const asTuple = (ret: Return<Model, any> | [Model, any]): [Model, any] => {
    if (Array.isArray(ret)) return ret;
    return [ret.model, ret.cmd];
};

export const BetWorkspaceFeature: Feature<Model, Msg> = {
    id: 'BET_WORKSPACE',

    init: () => {
        // Initialize Rules
        const rulesRet = initRules({} as any);

        // Combine with initial model
        return [initialModel, rulesRet.cmd];
    },

    update: (msg: Msg, model: Model) => {
        // 1. Delegate to sub-features using Pattern Matching
        const [nextModel, cmd] = match(msg)

            // Orchestration Logic
            .with({ type: 'SAVE_ALL_BETS' }, (m) => {
                log.info('Orchestrating BOLITA -> MANAGEMENT: Save Requested');
                return asTuple(updateManagement(model, {
                    type: ManagementMsgType.SHOW_SAVE_CONFIRMATION,
                    // @ts-ignore
                    drawId: m.payload.drawId
                }));
            })

            // Internal Features Delegation
            .with({ type: 'LIST' }, (m) => asTuple(updateList(model, m.payload)))
            .with({ type: 'SUCCESS' }, (m) => asTuple(updateSuccess(model, m.payload)))
            .with({ type: 'REWARDS_RULES' }, (m) => asTuple(updateRewardsRules(model, m.payload)))
            .with({ type: 'CREATE' }, (m) => asTuple(updateCreate(model, m.payload)))
            .with({ type: 'EDIT' }, (m) => asTuple(updateEdit(model, m.payload)))
            .with({ type: 'KEYBOARD' }, (m) => asTuple(updateKeyboard(model, m.payload)))
            .with({ type: 'UI' }, (m) => asTuple(updateUi(model, m.payload)))
            .with({ type: 'MANAGEMENT' }, (m) => asTuple(updateManagement(model, m.payload)))
            .with({ type: 'RULES' }, (m) => asTuple(updateRules(model, m.payload)))

            // External Features Delegation (Composite Pattern via Gateway)
            .otherwise((m) => {
                const result = ExternalFeaturesGateway.receive(m, model);
                if (result) {
                    return result;
                }
                // If not handled by gateway, it's an unhandled message
                return [model, Cmd.none];
            });

        // 3. Post-Update: Calculate Summary
        const finalModel = calculateSummary(nextModel);

        return [finalModel, cmd];
    },

    subscriptions: (model: Model) => {
        return ExternalFeaturesGateway.subscriptions(model);
    },

    configure: (config: { externalGateway: ExternalFeaturesHandler }) => {
        if (config.externalGateway) {
            log.info('Configuring ExternalFeaturesGateway via Kernel Injection');
            ExternalFeaturesGateway.register(config.externalGateway);
        }
    }
};
