import { createElmStore } from '@/shared/core/engine/engine';
import { effectHandlers, Cmd, Sub } from '@/shared/core/tea-utils';
import { createLoggerMiddleware } from '@/shared/core/middlewares/logger.middleware';
import { BolitaModel } from '../domain/models/bolita.types';
import { initialBolitaModel } from '../domain/models/bolita.initial';
import { update } from '../application/bolita';
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
    {
        initial: init,
        update: update,
        subscriptions
    }
);

export const selectBolitaModel = (state: { model: BolitaModel }) => state.model;
export const selectDispatch = (state: { dispatch: (msg: BolitaMsg) => void }) => state.dispatch;
