
import { ret, singleton, Return } from '@core/tea-utils/return';
import { CoreModel } from './model';
import { CoreMsg } from './msg';
import { Cmd } from '@core/tea-utils/cmd';
import { SYSTEM_READY } from '@/config/signals';
import { AuthRepository } from '@shared/repositories/auth';
import { CoreService } from './service';
import { systemJanitor } from './services/system-janitor.service';
import { logger } from '../../shared/utils/logger';

const log = logger.withTag('CORE_MODULE_UPDATE');

export function update(model: CoreModel, msg: CoreMsg): Return<CoreModel, CoreMsg> {
  log.debug(`Processing core message: ${msg.type}`, { bootstrapStatus: model.bootstrapStatus });

  switch (msg.type) {
    case 'BOOTSTRAP_STARTED': {
      log.info('Core bootstrap started');
      if (model.bootstrapStatus === 'INITIALIZING') {
        return singleton(model);
      }

      return ret(
        { ...model, bootstrapStatus: 'INITIALIZING', error: null },
        Cmd.task({
          task: () => {
            log.debug('CoreService.initializeInfrastructure() task starting...');
            return CoreService.initializeInfrastructure();
          },
          onSuccess: (hasSession: boolean): CoreMsg => {
            log.info('Core infrastructure initialized', { hasSession });
            return {
              type: 'BOOTSTRAP_COMPLETED',
              payload: hasSession ? 'AUTHENTICATED' : 'UNAUTHENTICATED'
            };
          },
          onFailure: (error: any): CoreMsg => {
            log.error('Core infrastructure initialization failed', error);
            const userMessage = CoreService.translateError(error.status || 500, String(error));
            return {
              type: 'BOOTSTRAP_FAILED',
              payload: userMessage
            };
          },
          label: 'INITIALIZE_INFRASTRUCTURE'
        })
      );
    }

    case 'BOOTSTRAP_COMPLETED': {
      log.info('Core bootstrap completed', { sessionStatus: msg.payload });
      const isAuth = msg.payload === 'AUTHENTICATED';
      const isProfileReady = !isAuth;
      const isSystemReady = isProfileReady && model.isMaintenanceReady;

      return ret(
        {
          ...model,
          bootstrapStatus: 'READY',
          sessionStatus: msg.payload,
          // Si no está autenticado, el perfil está "listo" (vacío) para propósitos de orquestación
          isProfileReady,
          isSystemReady
        },
        Cmd.batch([
          Cmd.task({
            task: (dispatch) => {
              log.debug('Setting up API handlers...');
              return CoreService.setupApiHandlers(dispatch);
            },
            onSuccess: () => ({ type: 'NO_OP' } as any),
            onFailure: () => ({ type: 'NO_OP' } as any),
            label: 'SETUP_API_HANDLERS'
          }),
          // Si está autenticado, validamos el contexto de sesión inmediatamente
          isAuth ? Cmd.task({
            task: async () => {
              log.debug('Verifying session context...');
              let user = await AuthRepository.hydrate();

              // Si tenemos usuario pero NO estructura, intentamos refrescar desde la API
              if (user && !user.structure) {
                log.warn('User found but structure is missing, attempting API refresh...');
                const result = await AuthRepository.refreshUserProfile();
                if (result.isOk()) {
                  user = result.value;
                }
              }

              return !!(user && user.structure);
            },
            onSuccess: (isReady) => isReady ? { type: 'SESSION_CONTEXT_READY' } : { type: 'SESSION_EXPIRED', reason: 'INCOMPLETE_PROFILE' },
            onFailure: () => ({ type: 'SESSION_EXPIRED', reason: 'PROFILE_FETCH_FAILED' }),
            label: 'VERIFY_SESSION_CONTEXT'
          }) : (isSystemReady ? Cmd.sendMsg(SYSTEM_READY({ date: new Date().toISOString().split('T')[0] })) : Cmd.none)
        ])
      );
    }

    case 'BOOTSTRAP_FAILED':
      return singleton({
        ...model,
        bootstrapStatus: 'ERROR',
        error: msg.payload
      });

    case 'SESSION_STATUS_CHANGED': {
      const newStatus = msg.payload;
      const commands: any[] = [];
      const isNewAuth = newStatus === 'AUTHENTICATED' && model.sessionStatus !== 'AUTHENTICATED';

      if (isNewAuth) {
        log.info('User authenticated, triggering reactive maintenance and profile verification');
        commands.push(
          Cmd.task({
            task: () => systemJanitor.prepareDailySession(),
            onSuccess: () => ({ type: 'NO_OP' } as any),
            onFailure: (err) => {
              log.error('Reactive maintenance failed', err);
              return { type: 'NO_OP' } as any;
            },
            label: 'REACTIVE_MAINTENANCE'
          }),
          Cmd.task({
            task: async () => {
              log.debug('Verifying session context after status change...');
              let user = await AuthRepository.hydrate();

              if (user && !user.structure) {
                log.warn('User found but structure is missing after login, attempting API refresh...');
                const result = await AuthRepository.refreshUserProfile();
                if (result.isOk()) {
                  user = result.value;
                }
              }

              return !!(user && user.structure);
            },
            onSuccess: (isReady) => isReady ? { type: 'SESSION_CONTEXT_READY' } : { type: 'SESSION_EXPIRED', reason: 'INCOMPLETE_PROFILE' },
            onFailure: () => ({ type: 'SESSION_EXPIRED', reason: 'PROFILE_FETCH_FAILED' }),
            label: 'VERIFY_SESSION_CONTEXT'
          })
        );
      }

      return ret(
        {
          ...model,
          sessionStatus: newStatus,
          isProfileReady: isNewAuth ? false : model.isProfileReady,
          isSystemReady: isNewAuth ? false : model.isSystemReady
        },
        Cmd.batch(commands)
      );
    }

    case 'SESSION_CONTEXT_READY': {
      log.info('Session context is ready and verified');
      const isSystemReady = model.isMaintenanceReady;
      const nextModel = { ...model, isProfileReady: true, isSystemReady };

      if (isSystemReady) {
        return ret(
          nextModel,
          Cmd.sendMsg(SYSTEM_READY({ date: new Date().toISOString().split('T')[0] }))
        );
      }

      return singleton(nextModel);
    }

    case 'MAINTENANCE_COMPLETED': {
      log.info('System maintenance completed successfully', { date: msg.payload.date });
      const isSystemReady = model.isProfileReady;
      const nextModel = { ...model, isMaintenanceReady: true, isSystemReady };

      if (isSystemReady) {
        return ret(
          nextModel,
          Cmd.sendMsg(SYSTEM_READY({ date: msg.payload.date }))
        );
      }

      return singleton(nextModel);
    }

    case 'SESSION_EXPIRED':
      return ret(
        { ...model, sessionStatus: 'EXPIRED' },
        Cmd.task({
          task: () => CoreService.logout(),
          onSuccess: (): CoreMsg => ({ type: 'SESSION_STATUS_CHANGED', payload: 'UNAUTHENTICATED' }),
          onFailure: (): CoreMsg => ({ type: 'SESSION_STATUS_CHANGED', payload: 'UNAUTHENTICATED' }),
          label: 'LOGOUT_ON_EXPIRATION'
        })
      );

    case 'NETWORK_STATUS_CHANGED':
      return singleton({ ...model, networkConnected: msg.payload });

    case 'RETRY_BOOTSTRAP':
      return update({ ...model, bootstrapStatus: 'IDLE' }, { type: 'BOOTSTRAP_STARTED' });

    default:
      return singleton(model);
  }
}
