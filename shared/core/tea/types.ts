/**
 * TEA Types - Shared types for the new TEA engine
 */

import { Cmd, CommandDescriptor } from '../tea-utils/cmd';
import { SubDescriptor } from '../tea-utils/sub';
import { TeaMiddleware } from '../middleware.types';

/**
 * Result from update function
 */
export type UpdateResult<TModel, TMsg> = [TModel, Cmd] | {
    model: TModel;
    cmd: Cmd;
};

/**
 * ElmStore interface
 */
export interface ElmStore<TModel = any, TMsg = any> {
    (selector?: (state: StoreState<TModel, TMsg>) => any): StoreState<TModel, TMsg>;
    getState(): StoreState<TModel, TMsg>;
}

/**
 * State returned by ElmStore
 */
export interface StoreState<TModel, TMsg> {
    model: TModel;
    dispatch: (msg: TMsg) => void;
    init: (params?: any) => void;
    cleanup: () => void;
}

/**
 * Effect handler signature
 */
export type EffectHandler<T = any> = (
    payload: T,
    dispatch: (msg: any) => void
) => Promise<void> | void;

/**
 * Config object for createElmStore (alternative to positional params)
 */
export interface ElmStoreConfig<TModel, TMsg> {
    /** Unique ID for global registry */
    id?: string;
    /** Descriptive name for debugging */
    name?: string;
    /** Initial state */
    initial: TModel | ((params?: any) => UpdateResult<TModel, TMsg>);
    /** Update function */
    update: (model: TModel, msg: TMsg) => UpdateResult<TModel, TMsg>;
    /** Effect handlers (uses globals if not provided) */
    effectHandlers?: Record<string, EffectHandler>;
    /** Subscriptions (uses globals if not provided) */
    subscriptions?: (model: TModel) => SubDescriptor<TMsg>;
    /** Middlewares (uses globals if not provided) */
    middlewares?: TeaMiddleware<TModel, TMsg>[];
}

/**
 * Message with reply metadata
 */
export type MsgWithReply<TMsg = any> = TMsg & {
    replyTo?: string;
    responseTo?: string;
};

/**
 * Store factory (for lazy creation)
 */
export type StoreFactory<TModel = any, TMsg = any> = () => ElmStore<TModel, TMsg>;
