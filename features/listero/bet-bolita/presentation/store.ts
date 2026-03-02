import { createElmStore } from '@/shared/core/engine';
import { effectHandlers } from '@/shared/core/effect_handlers';
import { createLoggerMiddleware } from '@/shared/core/middlewares/logger.middleware';
import { BolitaModel } from '../domain/models/bolita.types';
import { initialBolitaModel } from '../domain/models/bolita.initial';
import { update } from '../application/bolita';
import { Cmd } from '@/shared/core/cmd';
import { Sub } from '@/shared/core/sub';
import { BolitaMsg } from '../domain/models/bolita.messages';

/**
 * 🏪 BOLITA STORE
 * 
 * TEA Engine instance for Bolita feature.
 * Connects Application (Update/Flows) with Domain (Model/Messages).
 * Following the TEA Clean Feature Design.
 */
const init = (params?: Partial<BolitaModel>): [BolitaModel, Cmd] => {
    return [
        { ...initialBolitaModel, ...params },
        Cmd.none
    ];
};

const subscriptions = (model: BolitaModel) => Sub.none();

export const useBolitaStore = createElmStore<BolitaModel, BolitaMsg>(
    init,
    update as any,
    effectHandlers as any,
    // @ts-ignore
    subscriptions,
    [createLoggerMiddleware("BET_BOLITA")]
);

export const selectBolitaModel = (state: any) => state.model;
export const selectDispatch = (state: { dispatch: (msg: BolitaMsg) => void }) => state.dispatch;
