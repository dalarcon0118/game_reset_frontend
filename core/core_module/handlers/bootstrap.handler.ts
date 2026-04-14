import { CoreModel } from '../model';
import { CoreMsg } from '../msg';
import { Return, ret } from '@core/tea-utils/return';
import { Cmd } from '@core/tea-utils/cmd';
import { CoreService } from '../service';
import { updateModel } from './utils';

export const BootstrapHandler = {
  handleStarted: (model: CoreModel): Return<CoreModel, CoreMsg> => {
    return ret(updateModel(model, { bootstrapStatus: 'INITIALIZING' as const }), CoreService.checkAndCleanSessionTask());
  },

  handleCompleted: (model: CoreModel, payload: any): Return<CoreModel, CoreMsg> => {
    const isAuth = payload === 'AUTHENTICATED';
    const nextModel = updateModel(model, {
      bootstrapStatus: 'READY' as const,
      sessionStatus: payload,
      isSessionContextVerified: false,
      isVerifyingSession: isAuth,
      error: null
    });

    return ret(
      nextModel,
      isAuth
        ? Cmd.batch([
          CoreService.verifySessionContextTask(),
          CoreService.maintenanceTask('INITIAL_MAINTENANCE'),
          CoreService.initializeSyncWorkerTask(),
          CoreService.syncPendingBetsOnStartupTask(),
          CoreService.syncTimeAnchorTask(),
          CoreService.initializeTelemetryTask()
        ])
        : (nextModel.isSystemReady ? Cmd.batch([
          CoreService.notifySystemReady(new Date().toISOString().split('T')[0]),
          CoreService.initializeTelemetryTask()
        ]) : Cmd.none)
    );
  },

  handleFailed: (model: CoreModel, payload: string): Return<CoreModel, CoreMsg> => {
    return ret(updateModel(model, { bootstrapStatus: 'ERROR' as const, error: payload }), Cmd.none);
  }
};
