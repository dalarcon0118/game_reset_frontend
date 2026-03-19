
import { ret, singleton, Return } from '@core/tea-utils/return';
import { CoreModel } from './model';
import { CoreMsg } from './msg';
import { Cmd } from '@core/tea-utils/cmd';
import { CoreService } from './service';
import { logger } from '../../shared/utils/logger';

import { match } from 'ts-pattern';

const log = logger.withTag('CORE_MODULE_UPDATE');

/**
 * Calcula el estado isSystemReady basado en maintenanceStatus y sessionStatus
 */
const calculateIsSystemReady = (model: CoreModel): boolean => {
  const hasMaintenance = model.maintenanceStatus?.status === 'ready';
  const isAuthOrUnauth = model.sessionStatus === 'AUTHENTICATED' || model.sessionStatus === 'UNAUTHENTICATED';
  return hasMaintenance && isAuthOrUnauth;
};

export function update(model: CoreModel, msg: CoreMsg): Return<CoreModel, CoreMsg> {
  log.debug(`Processing core message: ${msg.type}`, { bootstrapStatus: model.bootstrapStatus });

  return match<CoreMsg, Return<CoreModel, CoreMsg>>(msg)
    .with({ type: 'BOOTSTRAP_STARTED' }, () =>
      ret({ ...model, bootstrapStatus: 'INITIALIZING' as const }, Cmd.none)
    )

    .with({ type: 'BOOTSTRAP_COMPLETED' }, ({ payload }) => {
      const isAuth = payload === 'AUTHENTICATED';
      const nextModel = {
        ...model,
        bootstrapStatus: 'READY' as const,
        sessionStatus: payload,
        error: null,
        isSystemReady: calculateIsSystemReady({ ...model, sessionStatus: payload })
      };

      return ret(
        nextModel,
        isAuth
          ? Cmd.batch([CoreService.verifySessionContextTask(), CoreService.maintenanceTask('INITIAL_MAINTENANCE')])
          : (CoreService.isSystemReady(nextModel) ? CoreService.notifySystemReady(new Date().toISOString().split('T')[0]) : Cmd.none)
      );
    })

    .with({ type: 'BOOTSTRAP_FAILED' }, ({ payload }) =>
      ret({ ...model, bootstrapStatus: 'ERROR' as const, error: payload }, Cmd.none)
    )

    .with({ type: 'SESSION_STATUS_CHANGED' }, ({ payload }) => {
      const isNewAuth = payload === 'AUTHENTICATED' && model.sessionStatus !== 'AUTHENTICATED';
      const nextModel = {
        ...model,
        sessionStatus: payload,
        isSystemReady: calculateIsSystemReady({ ...model, sessionStatus: payload })
      };

      return ret(
        nextModel,
        isNewAuth
          ? Cmd.batch([CoreService.maintenanceTask('REACTIVE_MAINTENANCE'), CoreService.verifySessionContextTask()])
          : Cmd.none
      );
    })

    .with({ type: 'SESSION_CONTEXT_READY' }, () => {
      const nextModel = {
        ...model,
        sessionStatus: 'AUTHENTICATED' as const,
        isSystemReady: calculateIsSystemReady({ ...model, sessionStatus: 'AUTHENTICATED' })
      };
      return ret(
        nextModel,
        CoreService.isSystemReady(nextModel) ? CoreService.notifySystemReady(new Date().toISOString().split('T')[0]) : Cmd.none
      );
    })

    .with({ type: 'MAINTENANCE_COMPLETED' }, ({ payload }) => {
      const nextModel = {
        ...model,
        maintenanceStatus: payload,
        isSystemReady: calculateIsSystemReady({ ...model, maintenanceStatus: payload })
      };
      return ret(
        nextModel,
        CoreService.isSystemReady(nextModel) ? CoreService.notifySystemReady(payload.date) : Cmd.none
      );
    })

    .with({ type: 'SESSION_EXPIRED' }, () =>
      ret(
        {
          ...model,
          sessionStatus: 'EXPIRED' as const,
          isSystemReady: false // Sesión expirada = sistema no listo
        },
        Cmd.task({
          task: () => CoreService.logout(),
          onSuccess: () => ({ type: 'SESSION_STATUS_CHANGED', payload: 'UNAUTHENTICATED' }),
          onFailure: () => ({ type: 'SESSION_STATUS_CHANGED', payload: 'UNAUTHENTICATED' }),
          label: 'LOGOUT_ON_EXPIRATION'
        })
      )
    )

    .with({ type: 'PHYSICAL_CONNECTION_CHANGED' }, ({ payload }) => {
      const nextConnectivity = { ...model.connectivity, isPhysicalConnected: payload };
      // REGLA: Si no hay conexión física, el SSoT es false inmediatamente.
      // Si hay física, mantenemos el último estado de alcanzabilidad hasta que se verifique.
      const nextNetworkStatus = payload && nextConnectivity.isServerReachable;

      return ret(
        { ...model, connectivity: nextConnectivity, networkConnected: nextNetworkStatus },
        nextNetworkStatus !== model.networkConnected
          ? CoreService.syncNetworkStatus(nextNetworkStatus)
          : Cmd.none
      );
    })

    .with({ type: 'SERVER_REACHABILITY_CHANGED' }, ({ payload }) => {
      const nextConnectivity = { ...model.connectivity, isServerReachable: payload, lastCheck: Date.now() };
      // El SSoT depende de ambos sensores
      const nextNetworkStatus = nextConnectivity.isPhysicalConnected && payload;

      return ret(
        { ...model, connectivity: nextConnectivity, networkConnected: nextNetworkStatus },
        nextNetworkStatus !== model.networkConnected
          ? CoreService.syncNetworkStatus(nextNetworkStatus)
          : Cmd.none
      );
    })

    .with({ type: 'RETRY_BOOTSTRAP' }, () =>
      update({ ...model, bootstrapStatus: 'IDLE' as const }, { type: 'BOOTSTRAP_STARTED' })
    )

    .with({ type: 'SYSTEM_READY' }, ({ payload }) => {
      // El CoreModule notifica que el sistema está listo,
      // pero delega el procesamiento a otros módulos vía signalBus o suscripciones
      log.debug(`SYSTEM_READY received with date: ${payload?.date}`);
      return singleton(model);
    })

    .with({ type: 'NO_OP' }, () => singleton(model))
    .exhaustive();
}
