
import { singleton, Return } from '@core/tea-utils/return';
import { CoreModel } from './model';
import { CoreMsg } from './msg';
import { logger } from '../../shared/utils/logger';

import { match } from 'ts-pattern';

// Handlers
import { BootstrapHandler } from './handlers/bootstrap.handler';
import { SessionHandler } from './handlers/session.handler';
import { ConnectivityHandler } from './handlers/connectivity.handler';
import { MaintenanceHandler } from './handlers/maintenance.handler';

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
    .with({ type: 'PHYSICAL_CONNECTION_CHANGED' }, ({ payload }) =>
      ConnectivityHandler.handlePhysicalChanged(model, payload)
    )
    .with({ type: 'SERVER_REACHABILITY_CHANGED' }, ({ payload }) =>
      ConnectivityHandler.handleServerChanged(model, payload)
    )
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
    .with({ type: 'NO_OP' }, () => singleton(model))
    .exhaustive();
}
