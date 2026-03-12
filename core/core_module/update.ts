
import { ret, singleton, Return } from '@core/tea-utils/return';
import { CoreModel } from './model';
import { CoreMsg } from './msg';
import { Cmd } from '@core/tea-utils/cmd';
import { AuthRepository } from '@shared/repositories/auth';
import { CoreService } from './service';

export function update(model: CoreModel, msg: CoreMsg): Return<CoreModel, CoreMsg> {
  switch (msg.type) {
    case 'BOOTSTRAP_STARTED': {
      if (model.bootstrapStatus === 'INITIALIZING') {
        return singleton(model);
      }

      return ret(
        { ...model, bootstrapStatus: 'INITIALIZING', error: null },
        Cmd.task({
          task: () => CoreService.initializeInfrastructure(),
          onSuccess: (hasSession: boolean): CoreMsg => ({
            type: 'BOOTSTRAP_COMPLETED',
            payload: hasSession ? 'AUTHENTICATED' : 'UNAUTHENTICATED'
          }),
          onFailure: (error: any): CoreMsg => ({
            type: 'BOOTSTRAP_FAILED',
            payload: String(error)
          }),
          label: 'INITIALIZE_INFRASTRUCTURE'
        })
      );
    }

    case 'BOOTSTRAP_COMPLETED':
      return ret(
        {
          ...model,
          bootstrapStatus: 'READY',
          sessionStatus: msg.payload
        },
        Cmd.batch([
          Cmd.task({
            task: (dispatch) => CoreService.setupApiHandlers(dispatch),
            onSuccess: () => ({ type: 'NO_OP' } as any),
            onFailure: () => ({ type: 'NO_OP' } as any),
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
