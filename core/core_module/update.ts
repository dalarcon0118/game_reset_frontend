import { singleton, Return, ret } from '@core/tea-utils/return';
import { CoreModel } from './model';
import { CoreMsg } from './msg';
import { logger } from '../../shared/utils/logger';
import { match } from 'ts-pattern';
import { BootstrapHandler } from './handlers/bootstrap.handler';
import { SessionHandler } from './handlers/session.handler';
import { ConnectivityHandler } from './handlers/connectivity.handler';
import { MaintenanceHandler } from './handlers/maintenance.handler';
import { updateModel } from './handlers/utils';
import { Cmd } from '@/shared/core';
import { CoreService } from './service';

const log = logger.withTag('CORE_MODULE_UPDATE');

export function update(model: CoreModel, msg: CoreMsg): Return<CoreModel, CoreMsg> {
    log.debug(`Processing core message: ${msg.type}`, { bootstrapStatus: model.bootstrapStatus });

    return match<CoreMsg, Return<CoreModel, CoreMsg>>(msg)
        .with({ type: 'BOOTSTRAP_STARTED' }, () => BootstrapHandler.handleStarted(model))
        .with({ type: 'BOOTSTRAP_COMPLETED' }, ({ payload }) => BootstrapHandler.handleCompleted(model, payload))
        .with({ type: 'BOOTSTRAP_FAILED' }, ({ payload }) => BootstrapHandler.handleFailed(model, payload))
        .with({ type: 'RETRY_BOOTSTRAP' }, () => update({ ...model, bootstrapStatus: 'IDLE' as const }, { type: 'BOOTSTRAP_STARTED' }))
        .with({ type: 'SERVER_ERROR_500' }, ({ payload }) => {
            log.error(`[SERVER_ERROR_500] Error crítico del servidor`, payload);
            return ret(
                { ...model, lastServerError: payload, error: payload.message },
                Cmd.navigate({ pathname: '/error', params: { message: payload.message } })
            );
        })
        .with({ type: 'VERSION_MISMATCH_CLEANED' }, ({ payload }) => {
            log.info(`[VERSION_FLOW] Datos de sesión limpiados por actualización: ${payload.previousVersion || 'initial'} -> ${payload.currentVersion}`);
            return ret(
                updateModel(model, {
                    storedAppVersion: payload.currentVersion,
                    wasSessionCleanedByVersionMismatch: true
                }),
                Cmd.none
            );
        })
        .with({ type: 'SESSION_STATUS_CHANGED' }, ({ payload }) => {
            log.info(`[SESSION_FLOW] 🔄 Estado de sesión cambiado: ${payload}`);
            return SessionHandler.handleStatusChanged(model, payload);
        })
        .with({ type: 'SESSION_CONTEXT_READY' }, ({ payload }) => {
            log.info(`[SESSION_FLOW] ✅ Contexto de sesión listo para: ${payload.structureId}`);
            return SessionHandler.handleContextReady(model, payload);
        })
        .with({ type: 'SESSION_EXPIRED' }, () => {
            log.warn(`[SESSION_FLOW] ⚠️ Sesión expirada`);
            return SessionHandler.handleExpired(model);
        })
        .with({ type: 'PHYSICAL_CONNECTION_CHANGED' }, ({ payload }) => {
            const result = ConnectivityHandler.handlePhysicalChanged(model, payload);
            if (payload && model.sessionStatus === 'AUTHENTICATED') {
                return ret(
                    result.model,
                    Cmd.batch([result.cmd, Cmd.ofMsg({ type: 'CHECK_SESSION_EXPIRATION' } as CoreMsg)])
                );
            }
            return result;
        })
        .with({ type: 'SERVER_REACHABILITY_CHANGED' }, ({ payload }) => {
            const result = ConnectivityHandler.handleServerChanged(model, payload);
            if (payload && model.sessionStatus === 'AUTHENTICATED') {
                return ret(
                    result.model,
                    Cmd.batch([result.cmd, Cmd.ofMsg({ type: 'CHECK_SESSION_EXPIRATION' } as CoreMsg)])
                );
            }
            return result;
        })
        .with({ type: 'SET_OFFLINE_MODE' }, ({ payload }) => ConnectivityHandler.handleSetManualOffline(model, payload))
        .with({ type: 'MAINTENANCE_COMPLETED' }, ({ payload }) => MaintenanceHandler.handleCompleted(model, payload))
        .with({ type: 'SYSTEM_READY' }, ({ payload }) => {
            log.debug(`SYSTEM_READY received with date: ${payload?.date}`);
            return singleton(model);
        })
        .with({ type: 'CHECK_SESSION_EXPIRATION' }, () => {
            return ret(model, CoreService.checkSessionExpirationTask());
        })
        .with({ type: 'TIME_ANCHOR_TICK' }, () => {
            return ret(model, CoreService.syncTimeAnchorTask());
        })
        .with({ type: 'CHECK_INACTIVITY' }, () => {
            return ret(model, CoreService.checkInactivityTask());
        })
        .with({ type: 'NO_OP' }, () => singleton(model))
        .exhaustive(() => {
            log.error(`Unknown message message: ${msg.type}`);
            return singleton(model);
        });
}