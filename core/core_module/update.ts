
import { singleton, Return, ret } from '@core/tea-utils/return';
import { CoreModel } from './model';
import { CoreMsg } from './msg';
import { logger } from '../../shared/utils/logger';

import { match } from 'ts-pattern';

// Handlers
import { BootstrapHandler } from './handlers/bootstrap.handler';
import { SessionHandler } from './handlers/session.handler';
import { ConnectivityHandler } from './handlers/connectivity.handler';
import { MaintenanceHandler } from './handlers/maintenance.handler';
import { Cmd } from '@/shared/core';
import { CoreService } from './service';

const log = logger.withTag('CORE_MODULE_UPDATE');

export function update(model: CoreModel, msg: CoreMsg): Return<CoreModel, CoreMsg> {
  log.debug(`Processing core message: ${msg.type}`, { bootstrapStatus: model.bootstrapStatus });

  return match<CoreMsg, Return<CoreModel, CoreMsg>>(msg)
    // --- Dominio de Inicialización (Bootstrap) ---
    .with({ type: 'BOOTSTRAP_STARTED' }, () =>
      BootstrapHandler.handleStarted(model)
    )
    .with({ type: 'BOOTSTRAP_COMPLETED' }, ({ payload }) =>
      BootstrapHandler.handleCompleted(model, payload)
    )
    .with({ type: 'BOOTSTRAP_FAILED' }, ({ payload }) =>
      BootstrapHandler.handleFailed(model, payload)
    )
    .with({ type: 'RETRY_BOOTSTRAP' }, () =>
      update({ ...model, bootstrapStatus: 'IDLE' as const }, { type: 'BOOTSTRAP_STARTED' })
    )

    // --- Dominio de Sesión y Usuario ---
    .with({ type: 'SESSION_STATUS_CHANGED' }, ({ payload }) =>
      SessionHandler.handleStatusChanged(model, payload)
    )
    .with({ type: 'SESSION_CONTEXT_READY' }, ({ payload }) =>
      SessionHandler.handleContextReady(model, payload)
    )
    .with({ type: 'SESSION_EXPIRED' }, () =>
      SessionHandler.handleExpired(model)
    )

    // --- Dominio de Red y Conectividad ---
    .with({ type: 'PHYSICAL_CONNECTION_CHANGED' }, ({ payload }) => {
      const result = ConnectivityHandler.handlePhysicalChanged(model, payload);
      // Al recuperar conexión, verificamos también la sesión
      if (payload && model.sessionStatus === 'AUTHENTICATED') {
        return ret(result.model, Cmd.batch([result.cmd, CoreService.checkSessionExpirationTask()]));
      }
      return result;
    })
    .with({ type: 'SERVER_REACHABILITY_CHANGED' }, ({ payload }) => {
      const result = ConnectivityHandler.handleServerChanged(model, payload);
      if (payload && model.sessionStatus === 'AUTHENTICATED') {
        return ret(result.model, Cmd.batch([result.cmd, CoreService.checkSessionExpirationTask()]));
      }
      return result;
    })
    .with({ type: 'SET_OFFLINE_MODE' }, ({ payload }) =>
      ConnectivityHandler.handleSetManualOffline(model, payload)
    )

    // --- Dominio de Mantenimiento ---
    .with({ type: 'MAINTENANCE_COMPLETED' }, ({ payload }) =>
      MaintenanceHandler.handleCompleted(model, payload)
    )

    // --- Sistema y Otros ---
    .with({ type: 'SYSTEM_READY' }, ({ payload }) => {
      log.debug(`SYSTEM_READY received with date: ${payload?.date}`);
      return singleton(model);
    })
    .with({ type: 'CHECK_SESSION_EXPIRATION' }, () => {
      return ret(model, CoreService.checkSessionExpirationTask());
    })
    .with({ type: 'NO_OP' }, () => singleton(model))
    .exhaustive(() => {
      log.error(`Unknown message message: ${msg.type}`);
      // Si no se encuentra una coincidencia, devolver el modelo original
      return singleton(model);
    });
}
