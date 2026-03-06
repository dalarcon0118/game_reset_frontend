import { match } from 'ts-pattern';
import {
    BolitaMsg,
    PARLET,
    FIJOS,
    CENTENA,
    LIST,
    EDIT,
    KEY_PRESSED,
    SAVE_ALL_BETS,
    SAVE_BETS_RESPONSE,
    BOLITA_BETS_UPDATED
} from '../domain/models/bolita.messages';
import { BolitaModel } from '../domain/models/bolita.types';
import { Return, singleton } from '@/shared/core/tea-utils';
import { updateParlet, updateFijos, updateCentena, updateList, updateEdit } from './sub_updates';
import { BolitaFlows } from './bolita.flows';

/**
 * 🚀 BOLITA APPLICATION
 * Main update function for the Bolita feature.
 * Delegates to sub-feature update functions and orchestration flows.
 * Following the TEA Clean Feature Design.
 */
export const update = (model: BolitaModel, msg: BolitaMsg): Return<BolitaModel, BolitaMsg> => {
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
        .with(SAVE_ALL_BETS.type(), ({ payload: { drawId } }) => {
            return BolitaFlows.saveAllBets(model, drawId);
        })
        .with(SAVE_BETS_RESPONSE.type(), ({ payload: { response } }) => {
            return BolitaFlows.handleSaveResponse(model, response);
        })
        .with(BOLITA_BETS_UPDATED.type(), () => {
            return singleton(model);
        })
        .otherwise(() => {
            return singleton(model);
        });
};
