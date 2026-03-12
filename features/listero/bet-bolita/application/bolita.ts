import { match } from 'ts-pattern';
import {
    BolitaMsg,
    PARLET,
    FIJOS,
    CENTENA,
    LIST,
    EDIT,
    KEY_PRESSED,
    REQUEST_SAVE_ALL_BETS,
    CONFIRM_SAVE_ALL_BETS,
    SET_USER_CONTEXT,
    SAVE_BETS_RESPONSE,
    BOLITA_BETS_UPDATED,
    CLOSE_KEYBOARD,
    CONFIRM_INPUT
} from '../domain/models/bolita.messages';
import { BolitaModel } from '../domain/models/bolita.types';
import { Return, singleton } from '@core/tea-utils';
import { updateParlet, updateFijos, updateCentena, updateList, updateEdit } from './sub_updates';
import { BolitaFlows } from './bolita.flows';
import logger from '@/shared/utils/logger';

/**
 * 🚀 BOLITA APPLICATION
 * Main update function for the Bolita feature.
 * Delegates to sub-feature update functions and orchestration flows.
 * Following the TEA Clean Feature Design.
 */
export const update = (model: BolitaModel, msg: BolitaMsg): Return<BolitaModel, BolitaMsg> => {
    const log = logger.withTag('BOLITA_UPDATE');
    return match<BolitaMsg, Return<BolitaModel, BolitaMsg>>(msg)
        .with(PARLET.type(), (m) => {
            return singleton((m: BolitaModel) => m)
                .andMapCmd(PARLET, updateParlet(model, m.payload));
        })
        .with(FIJOS.type(), (m) => {
            return singleton((m: BolitaModel) => m)
                .andMapCmd(FIJOS, updateFijos(model, m.payload));
        })
        .with(CENTENA.type(), (m) => {
            return singleton((m: BolitaModel) => m)
                .andMapCmd(CENTENA, updateCentena(model, m.payload));
        })
        .with(LIST.type(), (m) => {
            return singleton((m: BolitaModel) => m)
                .andMapCmd(LIST, updateList(model, m.payload));
        })
        .with(EDIT.type(), (m) => {
            return singleton((m: BolitaModel) => m)
                .andMapCmd(EDIT, updateEdit(model, m.payload));
        })
        .with(KEY_PRESSED.type(), ({ payload: { key } }) => {
            return BolitaFlows.handleKeyPress(model, key);
        })
        .with(REQUEST_SAVE_ALL_BETS.type(), ({ payload: { drawId } }) => {
            return BolitaFlows.requestSaveAllBets(model, drawId);
        })
        .with(CONFIRM_SAVE_ALL_BETS.type(), ({ payload: { drawId } }) => {
            return BolitaFlows.executeSaveAllBets(model, drawId);
        })
        .with(SET_USER_CONTEXT.type(), ({ payload: { structureId } }) => {
            log.debug('[update]SET_USER_CONTEXT: Setting user context structureId:', structureId);
            return singleton({ ...model, userStructureId: structureId });
        })
        .with(SAVE_BETS_RESPONSE.type(), ({ payload: { response } }) => {
            return BolitaFlows.handleSaveResponse(model, response);
        })
        .with(BOLITA_BETS_UPDATED.type(), () => {
            return singleton(model);
        })
        .with(CLOSE_KEYBOARD.type(), () => {
            return BolitaFlows.handleCloseKeyboard(model);
        })
        .with(CONFIRM_INPUT.type(), () => {
            return BolitaFlows.handleConfirmInput(model);
        })
        .otherwise(() => {
            return singleton(model);
        });
};
