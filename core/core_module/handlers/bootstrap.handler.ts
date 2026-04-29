import { CoreModel } from '../model';
import { CoreMsg } from '../msg';
import { Return, ret } from '@core/tea-utils/return';
import { Cmd } from '@core/tea-utils/cmd';
import { CoreService } from '../service';
import { updateModel } from './utils';

export const BootstrapHandler = {
  handleStarted: (model: CoreModel): Return<CoreModel, CoreMsg> => {
    // ⚡ Inicializar telemetría PRIMERO para capturar errores de login
    // El observer debe estar registrado ANTES de que el usuario intente hacer login
    return ret(
      updateModel(model, { bootstrapStatus: 'INITIALIZING' as const }),
      Cmd.batch([
        CoreService.initializeTelemetryTask(),
        CoreService.checkAndCleanSessionTask()
      ])
    );
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

    // SSOT: Maintenance is a SYSTEM-LEVEL concern, independent of user authentication
    // It verifies if daily cleanup was done and runs if needed
    return ret(
      nextModel,
      Cmd.batch([
        CoreService.maintenanceTask('INITIAL_MAINTENANCE'),
        ...(isAuth
          ? [
              CoreService.verifySessionContextTask(),
              CoreService.initializeSyncWorkerTask(),
              CoreService.syncPendingBetsOnStartupTask(),
              CoreService.syncTimeAnchorTask()
            ]
          : (nextModel.isSystemReady
              ? [CoreService.notifySystemReady(new Date().toISOString().split('T')[0])]
              : []))
      ])
    );
  },

  handleFailed: (model: CoreModel, payload: string): Return<CoreModel, CoreMsg> => {
    return ret(updateModel(model, { bootstrapStatus: 'ERROR' as const, error: payload }), Cmd.none);
  }
};
