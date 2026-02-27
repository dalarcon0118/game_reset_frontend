import { match } from 'ts-pattern';
import { Cmd } from '@/shared/core/cmd';
import { BolitaModel } from './model';
import { BolitaMsg, PARLET, FIJOS, CENTENA, LIST, EDIT, SAVE_ALL_BETS, BOLITA_BETS_UPDATED } from './types';

// Sub-features Logic
import { updateParlet } from '../parlet/parlet.update';
import { updateFijos } from '../standard/fijos.update';
import { updateCentena } from '../centena/centena.update';
import { updateList } from './list.update';
import { updateEdit } from './edit.update';

/**
 * Main update function for the Bolita feature.
 * Delegates to sub-feature update functions based on the message type.
 */
export const update = (model: BolitaModel, msg: BolitaMsg): [BolitaModel, Cmd] => {
    const result = match(msg)
        .with(PARLET.type(), (m) => {
            const ret = updateParlet(model, m.payload);
            return [ret.model, ret.cmd];
        })
        .with(FIJOS.type(), (m) => {
            const ret = updateFijos(model, m.payload);
            return [ret.model, ret.cmd];
        })
        .with(CENTENA.type(), (m) => {
            const ret = updateCentena(model, m.payload);
            return [ret.model, ret.cmd];
        })
        .with(LIST.type(), (m) => {
            const ret = updateList(model, m.payload);
            return [ret.model, ret.cmd];
        })
        .with(EDIT.type(), (m) => {
            const ret = updateEdit(model, m.payload);
            return [ret.model, ret.cmd];
        })
        .with(SAVE_ALL_BETS.type(), () => {
            // Logic for saving bets would be handled by a side effect or a specific command
            return [model, Cmd.none];
        })
        .with(BOLITA_BETS_UPDATED.type(), () => {
            return [model, Cmd.none];
        })
        .otherwise(() => {
            return [model, Cmd.none];
        });

    return result as [BolitaModel, any];
};
