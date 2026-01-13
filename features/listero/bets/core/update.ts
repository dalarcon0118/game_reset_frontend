import { match } from 'ts-pattern';
import { Model } from './model';
import { initialModel, Msg } from './msg';
import { Cmd } from '@/shared/core/cmd';
import { Return, singleton } from '@/shared/core/return';

import { updateManagement } from '../features/management/management.update';
import { updateKeyboard } from '../features/keyboard/keyboard.update';
import { updateList } from '../features/bet-list/list.update';
import { updateCreate } from '../features/create-bet/create.update';
import { updateEdit } from '../features/edit-bet/edit.update';
import { updateParlet } from '../features/parlet/parlet.update';
import { updateCentena } from '../features/centena/centena.update';
import { updateRules } from '../features/rules/rules.update';
import { updateRewardsRules } from '../features/rewards-rules/rewards.update';
import { updateUi } from '../features/bet-ui/ui.update';
import { updateFijos } from '../features/fijos-corridos/fijos.update';
import { ManagementMsgType } from '../features/management/management.types';

/**
 * Curried constructor helper for the Model.
 */
const makeModel = (m: Model) => m;

export const init = (params?: string | { drawId: string, fetchExistingBets?: boolean }): [Model, Cmd] => {
    const model = initialModel;

    if (!params) return [model, Cmd.none];

    let drawId: string;
    let fetchExistingBets = true;

    if (typeof params === 'string') {
        drawId = params;
    } else {
        drawId = params.drawId;
        fetchExistingBets = params.fetchExistingBets ?? true;
    }

    if (!drawId) return [model, Cmd.none];

    // Reutilizamos la lógica de MANAGEMENT.INIT
    const result = updateManagement(model, { type: ManagementMsgType.INIT, drawId, fetchExistingBets });
    return [result.model, result.cmd];
};

/**
 * Main update function using Hierarchical Message Composition.
 * Each module is responsible for its own state transition and commands,
 * which are wrapped back into the global Msg type.
 */
export const update = (model: Model, msg: Msg): [Model, Cmd] => {
    const result: Return<Model, Msg> = match(msg)
        .with({ type: 'MANAGEMENT' }, ({ payload }) =>
            singleton(makeModel).andMapCmd(
                (sub) => ({ type: 'MANAGEMENT', payload: sub }),
                updateManagement(model, payload)
            )
        )

        .with({ type: 'KEYBOARD' }, ({ payload }) =>
            singleton(makeModel).andMapCmd(
                (sub) => ({ type: 'KEYBOARD', payload: sub }),
                updateKeyboard(model, payload)
            )
        )

        .with({ type: 'LIST' }, ({ payload }) =>
            singleton(makeModel).andMapCmd(
                (sub) => ({ type: 'LIST', payload: sub }),
                updateList(model, payload)
            )
        )

        .with({ type: 'CREATE' }, ({ payload }) =>
            singleton(makeModel).andMapCmd(
                (sub) => ({ type: 'CREATE', payload: sub }),
                updateCreate(model, payload)
            )
        )

        .with({ type: 'EDIT' }, ({ payload }) =>
            singleton(makeModel).andMapCmd(
                (sub) => ({ type: 'EDIT', payload: sub }),
                updateEdit(model, payload)
            )
        )

        .with({ type: 'PARLET' }, ({ payload }) =>
            singleton(makeModel).andMapCmd(
                (sub) => ({ type: 'PARLET', payload: sub }),
                updateParlet(model, payload)
            )
        )

        .with({ type: 'CENTENA' }, ({ payload }) =>
            singleton(makeModel).andMapCmd(
                (sub) => ({ type: 'CENTENA', payload: sub }),
                updateCentena(model, payload)
            )
        )

        .with({ type: 'RULES' }, ({ payload }) =>
            singleton(makeModel).andMapCmd(
                (sub) => ({ type: 'RULES', payload: sub }),
                updateRules(model, payload)
            )
        )

        .with({ type: 'REWARDS_RULES' }, ({ payload }) =>
            singleton(makeModel).andMapCmd(
                (sub) => ({ type: 'REWARDS_RULES', payload: sub }),
                updateRewardsRules(model, payload)
            )
        )

        .with({ type: 'UI' }, ({ payload }) =>
            singleton(makeModel).andMapCmd(
                (sub) => ({ type: 'UI', payload: sub }),
                updateUi(model, payload)
            )
        )
        .with({ type: 'FIJOS' }, ({ payload }) =>
            singleton(makeModel).andMapCmd(
                (sub) => ({ type: 'FIJOS', payload: sub }),
                updateFijos(model, payload)
            )
        )

        .exhaustive();

    return [result.model, result.cmd];
};
