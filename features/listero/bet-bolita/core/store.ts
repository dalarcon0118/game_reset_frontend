import { createElmStore } from '@/shared/core/engine';
import { effectHandlers } from '@/shared/core/effect_handlers';
import { createLoggerMiddleware } from '@/shared/core/middlewares/logger.middleware';
import { BolitaModel, initialModel } from './model';
import { update } from './update';
import { Cmd } from '@/shared/core/cmd';
import { Sub } from '@/shared/core/sub';
import { BolitaMsg } from './types';

const init = (params?: Partial<BolitaModel>): [BolitaModel, Cmd] => {
    return [
        { ...initialModel, ...params },
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
