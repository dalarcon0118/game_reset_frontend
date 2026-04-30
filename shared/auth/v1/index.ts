import { initialModel, AuthModel, AuthStatus, Tokens } from './model';
import { update } from './update';
import { authSubscriptions } from './subscriptions';
import { Cmd } from '../../core/tea-utils/cmd';
import { AuthRepository } from '../../repositories/auth';
import { logger } from '../../utils/logger';
import { SESSION_CHANGED, SESSION_HYDRATED } from './msg';

export { AuthModel, AuthStatus, Tokens, isSessionHydrated, isFullyAuthenticated } from './model';

const log = logger.withTag('AUTH_V1');

/**
 * AuthServiceV1
 * Exportamos la definición para el motor TEA.
 * Al iniciar, hydratea la sesión desde storage y notifica al store.
 */
export const AuthServiceV1 = {
  initial: () => {
    const hydrateCmd = Cmd.task({
      task: () => AuthRepository.hydrate(),
      onSuccess: (user) => {
        log.info('Session hydrated on init', { hasUser: !!user, username: user?.username });
        return SESSION_CHANGED({ user, isOffline: false });
      },
      onFailure: (error) => {
        log.error('Session hydration failed on init', error);
        return SESSION_CHANGED({ user: null, isOffline: false });
      },
      label: 'AUTH_HYDRATE_ON_INIT'
    });

    return [initialModel, hydrateCmd] as [AuthModel, Cmd];
  },
  update,
  subscriptions: authSubscriptions
};
