import { CoreModel, SessionStatus } from '../model';
import { CoreMsg } from '../msg';
import { Return, ret } from '@core/tea-utils/return';
import { Cmd } from '@core/tea-utils/cmd';
import { CoreService } from '../service';
import { updateModel } from './utils';

export const SessionHandler = {
  handleStatusChanged: (model: CoreModel, payload: SessionStatus): Return<CoreModel, CoreMsg> => {
    const isNewAuth = payload === 'AUTHENTICATED' && model.sessionStatus !== 'AUTHENTICATED';
    const nextModel = updateModel(model, {
      sessionStatus: payload,
      isSessionContextVerified: isNewAuth ? false : model.isSessionContextVerified,
      isVerifyingSession: isNewAuth,
      error: null
    });

    return ret(
      nextModel,
      isNewAuth
        ? Cmd.batch([
          CoreService.maintenanceTask('REACTIVE_MAINTENANCE'),
          CoreService.verifySessionContextTask(),
          CoreService.syncPendingBetsOnStartupTask(),
          CoreService.syncTimeAnchorTask()
        ])
        : Cmd.none
    );
  },

  handleContextReady: (model: CoreModel, payload: { structureId: string; user: any }): Return<CoreModel, CoreMsg> => {
    const nextModel = updateModel(model, {
      sessionStatus: 'AUTHENTICATED' as const,
      isSessionContextVerified: true,
      isVerifyingSession: false,
      userContext: payload
    });
    
    return ret(
      nextModel,
      Cmd.batch([
        // CRÍTICO: Obtener Time Anchor inmediatamente después del login
        // Esto permite generar fingerprints offline desde el primer momento
        CoreService.syncTimeAnchorTask(),
        CoreService.syncPendingBetsOnStartupTask(),
        CoreService.syncPendingBetsTask(),
        nextModel.isSystemReady
          ? CoreService.notifySystemReady(new Date().toISOString().split('T')[0], payload)
          : Cmd.none
      ])
    );
  },

  handleExpired: (model: CoreModel): Return<CoreModel, CoreMsg> => {
    return ret(
      updateModel(model, {
        sessionStatus: 'EXPIRED' as const,
        isSessionContextVerified: false,
        isVerifyingSession: false
      }),
      Cmd.batch([
        Cmd.navigate({ pathname: '/login' }),
        Cmd.task({
          task: () => CoreService.logout(),
          onSuccess: () => ({ type: 'SESSION_STATUS_CHANGED', payload: 'UNAUTHENTICATED' }),
          onFailure: () => ({ type: 'SESSION_STATUS_CHANGED', payload: 'UNAUTHENTICATED' }),
          label: 'LOGOUT_ON_EXPIRATION'
        })
      ])
    );
  }
};
