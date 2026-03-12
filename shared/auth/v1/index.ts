import { initialModel, AuthModel, AuthStatus } from './model';
import { update } from './update';
import { authSubscriptions } from './subscriptions';
import { AuthMsg } from './msg';
import { Cmd } from '@core';

/**
 * AuthServiceV1
 * Exportamos la definición para el motor TEA y una factoría de servicio headless.
 */
export const AuthServiceV1 = {
    initial: () => [initialModel, Cmd.none] as [AuthModel, Cmd],
    update,
    subscriptions: authSubscriptions
};
