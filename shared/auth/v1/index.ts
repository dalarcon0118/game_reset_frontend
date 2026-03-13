import { initialModel, AuthModel } from './model';
import { update } from './update';
import { authSubscriptions } from './subscriptions';
import { Cmd } from '../../core/tea-utils/cmd';

/**
 * AuthServiceV1
 * Exportamos la definición para el motor TEA.
 * El bootstrap de la sesión ahora es responsabilidad del CoreModule (Kernel).
 * Este módulo inicia en estado IDLE y reacciona a los cambios del repositorio.
 */
export const AuthServiceV1 = {
    initial: () => [initialModel, Cmd.none] as [AuthModel, Cmd],
    update,
    subscriptions: authSubscriptions
};
