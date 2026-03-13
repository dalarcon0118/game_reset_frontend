
import { ret, singleton, Return } from '@core/tea-utils/return';
import { CoreModel } from './model';
import { CoreMsg } from './msg';
import { Cmd } from '@core/tea-utils/cmd';
import { AuthRepository } from '@shared/repositories/auth';
import { CoreService } from './service';
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
            return {
              type: 'BOOTSTRAP_FAILED',
              payload: String(error)
            };
          },
          label: 'INITIALIZE_INFRASTRUCTURE'
        })
      );
    }

    case 'BOOTSTRAP_COMPLETED':
      log.info('Core bootstrap completed', { sessionStatus: msg.payload });
      return ret(
        {
          ...model,
          bootstrapStatus: 'READY',
          sessionStatus: msg.payload
        },
        Cmd.batch([
          Cmd.task({
            task: (dispatch) => {
              log.debug('Setting up API handlers...');
              return CoreService.setupApiHandlers(dispatch);
            },
            onSuccess: () => {
              log.info('API handlers setup completed');
              return { type: 'NO_OP' } as any;
            },
            onFailure: (err) => {
              log.error('API handlers setup failed', err);
              return { type: 'NO_OP' } as any;
            },
            label: 'SETUP_API_HANDLERS'
          })
        ])
      );

    case 'BOOTSTRAP_FAILED':
      return singleton({
        ...model,
        bootstrapStatus: 'ERROR',
        error: msg.payload
      });

    case 'SESSION_STATUS_CHANGED':
      return singleton({ ...model, sessionStatus: msg.payload });

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
