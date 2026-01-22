import { match } from 'ts-pattern';
import { Model } from './model';
import { initialModel, Msg } from './msg';
import { Cmd } from '@/shared/core/cmd';
import { singleton, ret } from '@/shared/core/return';

import { updateManagement } from '../features/management/management.update';
import { updateKeyboard } from '../features/keyboard/keyboard.update';
import { updateList } from '../features/bet-list/list.update';
import { updateCreate } from '../features/create-bet/create.update';
import { updateEdit } from '../features/edit-bet/edit.update';
import { updateParlet } from '../features/parlet/parlet.update';
import { updateCentena } from '../features/centena/centena.update';
import { updateRules } from '../features/rules/rules.update';
import { updateRewardsRules } from '../features/rewards-rules/rewards.update';
import { RewardsRulesMsgType } from '../features/rewards-rules/rewards.types';
import { updateUi } from '../features/bet-ui/ui.update';
import { updateFijos } from '../features/fijos-corridos/fijos.update';
import { updateSuccess } from '../features/success/success.update';
import { updateLoteria } from '@/features/listero/games/loteria/loteria.update';
import { ManagementMsgType } from '../features/management/management.types';
import { CoreMsgType } from './msg';
import { DrawService } from '@/shared/services/Draw';
import { RemoteDataHttp } from '@/shared/core/remote.data.http';
import { RemoteData } from '@/shared/core/remote.data';

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

    // Reutilizamos la lógica de MANAGEMENT.INIT envolviendo los comandos correctamente
    const result = singleton(makeModel)
        .andMapCmd(
            (sub) => ({ type: 'MANAGEMENT', payload: sub }),
            updateManagement(model, { type: ManagementMsgType.INIT, drawId, fetchExistingBets })
        );

    // Agregamos el comando para obtener la info del sorteo
    const drawInfoCmd = RemoteDataHttp.fetch(
        async () => {
            const draw = await DrawService.getOne(drawId);
            if (!draw) {
                throw new Error('No se encontró el sorteo');
            }
            if (!draw.draw_type_details?.code) {
                throw new Error('El sorteo no tiene código de tipo');
            }
            return draw.draw_type_details.code;
        },
        (webData) => ({
            type: 'CORE',
            payload: { type: CoreMsgType.DRAW_INFO_RECEIVED, webData }
        })
    );

    // Agregamos el comando para obtener las reglas de validación
    const fetchRulesCmd = {
        type: 'MSG',
        payload: {
            type: 'REWARDS_RULES',
            payload: {
                type: RewardsRulesMsgType.FETCH_RULES_REQUESTED,
                drawId
            }
        }
    };

    return [
        { ...result.model, drawId },
        [result.cmd, drawInfoCmd, fetchRulesCmd] as Cmd
    ];
};

/**
 * Main update function using Hierarchical Message Composition.
 * Each module is responsible for its own state transition and commands,
 * which are wrapped back into the global Msg type.
 */
export const update = (model: Model, msg: Msg): [Model, Cmd] => {
    const result = match(msg)
        .with({ type: 'CORE' }, ({ payload }) => {
            return match(payload)
                .with({ type: CoreMsgType.DRAW_INFO_REQUESTED }, ({ drawId }) => {
                    const nextModel: Model = {
                        ...model,
                        drawTypeCode: RemoteData.loading<any, string>()
                    };

                    const cmd = RemoteDataHttp.fetch(
                        async () => {
                            const draw = await DrawService.getOne(drawId);
                            if (!draw) {
                                throw new Error('No se encontró el sorteo');
                            }
                            if (!draw.draw_type_details?.code) {
                                throw new Error('El sorteo no tiene código de tipo');
                            }
                            return draw.draw_type_details.code;
                        },
                        (webData) => ({
                            type: 'CORE',
                            payload: { type: CoreMsgType.DRAW_INFO_RECEIVED, webData }
                        })
                    );

                    return ret(nextModel, cmd);
                })
                .with({ type: CoreMsgType.DRAW_INFO_RECEIVED }, ({ webData }) => {
                    return singleton({
                        ...model,
                        drawTypeCode: webData as any
                    } as Model);
                })
                .exhaustive();
        })

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
        .with({ type: 'LOTERIA' }, ({ payload }) =>
            singleton(makeModel).andMapCmd(
                (sub) => ({ type: 'LOTERIA', payload: sub }),
                updateLoteria(model, payload)
            )
        )
        .with({ type: 'SUCCESS' }, ({ payload }) => {
            console.log('[core.update] Routing to SUCCESS feature:', payload.type);
            return singleton(makeModel).andMapCmd(
                (sub) => ({ type: 'SUCCESS', payload: sub }),
                updateSuccess(payload, model)
            )
        })

        .exhaustive();

    return [result.model, result.cmd];
};
