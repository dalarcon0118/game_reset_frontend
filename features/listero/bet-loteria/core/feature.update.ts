import { match, P } from 'ts-pattern';
import { LoteriaFeatureModel, FeatureMsg } from './feature.types';
import {
    OPEN_BET_KEYBOARD,
    CLOSE_BET_KEYBOARD,
    OPEN_AMOUNT_KEYBOARD,
    CLOSE_AMOUNT_KEYBOARD,
    KEY_PRESSED,
    CONFIRM_INPUT,
    PROCESS_BET_INPUT,
    SUBMIT_AMOUNT_INPUT,
    EDIT_LOTERIA_BET,
    REQUEST_SAVE,
    CONFIRM_SAVE_BETS,
    SAVE_BETS_RESPONSE,
    INIT,
    REFRESH_BETS,
    LoteriaMsg,
    LoteriaState
} from '../loteria/loteria.types';
import { updateLoteria } from '../loteria/loteria.update';
import { updateRules } from '../../bet-workspace/rules/core/update';
import { Return, singleton } from '@core/tea-utils';
import { FeatureFlows } from './feature.flows';
import { LoteriaDomain } from './feature.domain';
import logger from '@/shared/utils/logger';

const log = logger.withTag('LoteriaFeatureUpdate');
// ============================================================================
// 🔄 UPDATE FUNCTION
// ============================================================================

export const updateFeature = (model: LoteriaFeatureModel, msg: FeatureMsg): Return<LoteriaFeatureModel, FeatureMsg> => {

    if (!msg || !msg.type) {
        log.error('FEATURE_UPDATE_ERROR: msg or msg.type is undefined', { msg });
        return singleton(model);
    }

    return match<FeatureMsg, Return<LoteriaFeatureModel, FeatureMsg>>(msg)
        .with({ type: 'FETCH_DRAW_DETAILS_RESPONSE' }, ({ response }) => {
            return singleton(LoteriaDomain.updateDrawDetails(model, response));
        })
        .with({ type: 'FETCH_BET_TYPES_RESPONSE' }, ({ response }) => {
            log.debug('FETCH_BET_TYPES_RESPONSE', JSON.stringify(response));
            return singleton(LoteriaDomain.updateBetTypes(model, response));
        })
        .with({ type: 'FETCH_EXISTING_BETS_RESPONSE' }, ({ response }) => {
            return singleton(LoteriaDomain.updateExistingBets(model, response));
        })
        .with({ type: 'DRAW_INFO_RECEIVED' }, ({ webData }) => {
            return singleton({
                ...model,
                drawTypeCode: webData
            });
        })
        .with({ type: 'RULES' }, ({ payload: rulesMsg }) => {
            return updateRules(model, rulesMsg)
                .mapMsg((subMsg) => ({ type: 'RULES', payload: subMsg }));
        })
        .with({ type: 'LOTERIA' }, ({ payload: loteriaMsg }) => {
            return updateLoteriaOrchestration(model, loteriaMsg);
        })
        .exhaustive();
};

// ============================================================================
// 🎼 ORCHESTRATION (Complex Feature Logic)
// ============================================================================

const updateLoteriaOrchestration = (model: LoteriaFeatureModel, loteriaMsg: LoteriaMsg): Return<LoteriaFeatureModel, FeatureMsg> => {

    if (!loteriaMsg) {
        console.error('LOTERIA_UPDATE_ERROR: loteriaMsg is undefined');
        return singleton(model);
    }

    // C. Business Logic & Orchestration (Feature Level)
    const result = match<LoteriaMsg, Return<LoteriaFeatureModel, FeatureMsg>>(loteriaMsg)

        // --- UI Interactions ---
        .with(OPEN_BET_KEYBOARD.type(), () => FeatureFlows.resetInput(model))
        .with(CLOSE_BET_KEYBOARD.type(), () => FeatureFlows.resetInput(model))
        .with(OPEN_AMOUNT_KEYBOARD.type(), () => FeatureFlows.resetInput(model))
        .with(CLOSE_AMOUNT_KEYBOARD.type(), () => FeatureFlows.resetInput(model))
        .with(EDIT_LOTERIA_BET.type(), () => FeatureFlows.resetInput(model))

        // --- Input Handling ---
        .with(KEY_PRESSED.type(), ({ payload: { key } }) =>
            FeatureFlows.handleKeyPress(model, key)
        )

        .with(CONFIRM_INPUT.type(), () =>
            FeatureFlows.handleInputConfirmation(model)
        )

        // --- Business Logic ---
        .with(PROCESS_BET_INPUT.type(), ({ payload: { input } }) =>
            FeatureFlows.submitNewBet(model, input)
        )

        .with(SUBMIT_AMOUNT_INPUT.type(), ({ payload: { amount } }) =>
            FeatureFlows.submitBetAmount(model, amount)
        )

        // --- Persistence Flows ---
        .with(REQUEST_SAVE.type(), ({ payload: { drawId } }) =>
            FeatureFlows.requestSave(model, drawId)
        )

        .with(CONFIRM_SAVE_BETS.type(), ({ payload: { drawId } }) =>
            FeatureFlows.executeSave(model, drawId)
        )

        .with(SAVE_BETS_RESPONSE.type(), ({ payload: { response, drawId, receiptCode } }) =>
            FeatureFlows.handleSaveResponse(model, response, drawId, receiptCode)
        )

        // --- Orchestration ---
        .with(INIT.type(), ({ payload: { drawId, isEditing, structureId } }) =>
            FeatureFlows.init(model, drawId, isEditing, structureId)
        )

        .with(REFRESH_BETS.type(), ({ payload: { drawId } }) =>
            FeatureFlows.refreshBets(model, drawId)
        )

        // 🛡️ DEFAULT: Delegate to Pure UI Component
        .otherwise(() => singleton(model));

    // A. Delegate UI State to maintain synchronization
    // We always delegate to updateLoteria to ensure UI state (keyboards, visibility) 
    // is updated regardless of business logic orchestration.
    const makeModel = (orchestrationModel: LoteriaFeatureModel) => (uiState: LoteriaState): LoteriaFeatureModel => ({
        ...orchestrationModel,
        loteriaSession: uiState
    });

    return singleton(makeModel)
        .andMapCmd(
            (msg) => msg,
            result
        )
        .andMapCmd(
            (subMsg: LoteriaMsg) => ({ type: 'LOTERIA', payload: subMsg } as FeatureMsg),
            updateLoteria(loteriaMsg, result.model.loteriaSession)
        );
};
