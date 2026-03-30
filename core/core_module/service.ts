import NetInfo from '@react-native-community/netinfo';
import { IAuthRepository, IOfflineConditionChecker } from '@shared/repositories/auth';
import { hasDrawAvailable } from '@shared/repositories/draw';
import { betRepository } from '@shared/repositories/bet';
import { apiClient } from '@shared/services/api_client';
import { ConnectivityEvent } from '@shared/services/api_client/api_client.types';
import { isServerReachable } from '@shared/utils/network';
import { logger } from '@shared/utils/logger';
import { syncWorker } from '@shared/core/offline-storage/instance';
import { BetPushStrategy } from '@shared/repositories/bet/sync/bet.push.strategy';
import { DlqPushStrategy } from '@shared/repositories/dlq/sync/dlq.push.strategy';
import { DrawsPullStrategy } from '@shared/repositories/draw/sync/draws.pull.strategy';
import { TelemetryPushStrategy } from '@shared/repositories/system/telemetry/sync/telemetry.push.strategy';
import { CoreMsg } from './msg';
import { CoreModel } from './model';
import { systemJanitor } from './services/system-janitor.service';
import { Cmd } from '@core/tea-utils/cmd';
import { SYSTEM_READY } from '@/config/signals';

const log = logger.withTag('CORE_SERVICE');

let _authRepo: IAuthRepository | null = null;

/**
 * Inicializa las dependencias del servicio.
 * Permite el desacoplamiento de Repositorios concretos.
 */
export const setAuthRepository = (repo: IAuthRepository) => {
  _authRepo = repo;
};

const getAuthRepo = (): IAuthRepository => {
  if (!_authRepo) {
    throw new Error('CoreService: AuthRepository not initialized. Call setAuthRepository first.');
  }
  return _authRepo;
};

const syncPendingBetsIfOnlineAndNeeded = async (): Promise<{
  skipped: boolean;
  reason?: 'NO_PENDING' | 'OFFLINE';
  success?: number;
  failed?: number;
}> => {
  const pending = await betRepository.getPendingBets();
  if (pending.length === 0) {
    return { skipped: true, reason: 'NO_PENDING' };
  }

  const online = await isServerReachable();
  if (!online) {
    return { skipped: true, reason: 'OFFLINE' };
  }

  const result = await betRepository.syncPending();
  return { skipped: false, success: result.success, failed: result.failed };
};

/**
 * CoreService
 * 
 * Encapsula la lógica imperativa de inicialización y orquestación del sistema base.
 * Estas funciones son invocadas por el CoreModule mediante Cmd.task o utilidades de decisión.
 */
export const CoreService = {
  /**
   * Determina si el sistema está completamente listo para operar.
   * Single Source of Truth (SSoT) para el estado del sistema.
   */
  isSystemReady(model: CoreModel): boolean {
    const hasMaintenance = model.maintenanceStatus?.status === 'ready';
    const isAuthOrUnauth = model.sessionStatus === 'AUTHENTICATED' || model.sessionStatus === 'UNAUTHENTICATED';
    return hasMaintenance && isAuthOrUnauth;
  },

  /**
   * Crea un comando para notificar que el sistema está listo.
   * Se envía como 'sticky' para que los módulos que se carguen tarde lo reciban.
   */
  notifySystemReady(date: string, context?: { structureId: string; user: any } | null): Cmd {
    log.info('System fully ready, creating notification command (STICKY)...', { date, structureId: context?.structureId });
    return Cmd.sendMsg(SYSTEM_READY({
      date,
      structureId: context?.structureId,
      user: context?.user
    }), { sticky: true });
  },

  /**
   * Tarea para verificar el contexto de sesión.
   */
  verifySessionContextTask(): Cmd {
    return Cmd.task({
      task: () => this.verifySessionContext(),
      onSuccess: (context) => context
        ? { type: 'SESSION_CONTEXT_READY', payload: context }
        : { type: 'SESSION_EXPIRED', reason: 'INCOMPLETE_PROFILE' },
      onFailure: () => ({ type: 'SESSION_EXPIRED', reason: 'PROFILE_FETCH_FAILED' }),
      label: 'VERIFY_SESSION_CONTEXT'
    });
  },

  /**
   * Tarea para el mantenimiento del sistema.
   */
  maintenanceTask(label: string): Cmd {
    return Cmd.task({
      task: () => systemJanitor.prepareDailySession(),
      onSuccess: () => ({ type: 'NO_OP' } as any),
      onFailure: (err) => {
        log.error(`${label} maintenance failed`, err);
        return { type: 'NO_OP' } as any;
      },
      label
    });
  },

  /**
   * Verifica el contexto de la sesión (Perfil + Estructura)
   * Intenta refrescar si falta información crítica.
   */
  async verifySessionContext(): Promise<{ structureId: string; user: any } | null> {
    log.debug('Verifying session context...');
    const authRepo = getAuthRepo();
    let user = await authRepo.hydrate();

    const needsProfileRefresh = !!user && (!user.structure || user.structure.commission_rate === undefined);

    if (needsProfileRefresh) {
      log.warn('User profile missing required structure context, attempting API refresh...', {
        hasStructure: !!user?.structure,
        hasCommissionRate: user?.structure?.commission_rate !== undefined
      });
      const result = await authRepo.refreshUserProfile();
      if (result.isOk()) {
        user = result.value;
      }
    }

    if (user && user.structure) {
      return {
        structureId: String(user.structure.id),
        user
      };
    }

    return null;
  },

  /**
   * Cierra la sesión globalmente.
   */
  async logout(): Promise<void> {
    await getAuthRepo().logout();
  },

  /**
   * Sincroniza el estado de red con el AuthRepository.
   * Esto asegura que el AuthRepository tenga el SSoT de red.
   */
  syncNetworkStatus(isOnline: boolean): Cmd {
    return Cmd.task({
      task: () => {
        log.debug(`Syncing network status to AuthRepository: ${isOnline}`);
        getAuthRepo().setNetworkStatus(isOnline);
        return Promise.resolve();
      },
      onSuccess: () => ({ type: 'NO_OP' } as any),
      onFailure: (err) => {
        log.error('Failed to sync network status to AuthRepository', err);
        return { type: 'NO_OP' } as any;
      },
      label: 'SYNC_NETWORK_STATUS'
    });
  },

  /**
   * Inicializa el checker de condiciones offline en AuthRepository.
   * Este checker verifica si hay sorteos disponibles antes de permitir login offline.
   */
  initializeOfflineConditionChecker(): void {
    const offlineConditionChecker: IOfflineConditionChecker = {
      canContinueOffline: async () => {
        return await hasDrawAvailable();
      }
    };
    getAuthRepo().setOfflineConditionChecker(offlineConditionChecker);
    log.info('Offline condition checker initialized in AuthRepository');
  },

  /**
   * Configura los handlers estáticos del API Client (errores y expiración).
   * Estos no requieren dispatch directo y se configuran una sola vez.
   */
  setupStaticApiHandlers(): void {
    log.debug('Setting up static API handlers...');
    const authRepo = getAuthRepo();

    // 1. Escuchar expiraciones desde el API Client (CredentialProvider)
    apiClient.setSessionExpiredHandler(() => {
      // Notificamos al repositorio para que emita la señal global
      authRepo.notifySessionExpired('API_CLIENT_REFRESH_FAILED');
    });

    apiClient.setErrorHandler(async (error: any, endpoint: string) => {
      // Evitar bucles en endpoints críticos de auth
      if (endpoint.includes('/login') || endpoint.includes('/token')) return null;

      if (error.status === 401) {
        // Notificamos al repositorio para que emita la señal global
        authRepo.notifySessionExpired('UNAUTHORIZED_API_RESPONSE');
      }
      return null;
    });
  },

  /**
   * Suscribe el dispatch a los eventos de conectividad del API Client y NetInfo.
   */
  subscribeToConnectivity(dispatch: (msg: CoreMsg) => void): () => void {
    log.debug('Subscribing to hybrid connectivity sensors...');

    // 1. Sensor Activo (NetInfo): Hardware/Sistema Operativo
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const isConnected = !!(state.isConnected && state.isInternetReachable);

      log.info(`[CONNECTIVITY-ACTIVO] NetInfo update: ${isConnected ? 'CONNECTED' : 'DISCONNECTED'}`, {
        type: state.type,
        details: state.details
      });

      dispatch({ type: 'PHYSICAL_CONNECTION_CHANGED', payload: isConnected });

      // Si recuperamos conexión física, forzamos un ping de validación inmediata
      if (isConnected) {
        isServerReachable().then(reachable => {
          // Solo despachamos si el servidor es realmente alcanzable
          if (reachable) {
            dispatch({ type: 'SERVER_REACHABILITY_CHANGED', payload: true });
          }
        });
      }
    });

    // 2. Sensor Pasivo (ApiClient): Tráfico real con el servidor
    try {
      apiClient.config({
        onConnectivity: (event: ConnectivityEvent) => {
          const isReachable = event.type === 'ONLINE';

          log.info(`[CONNECTIVITY-PASIVO] ApiClient update: ${event.type}`, {
            status: event.status,
            timestamp: new Date(event.timestamp).toISOString()
          });

          // Solo notificamos ONLINE si el ApiClient lo confirma (ya filtrado de 401s)
          dispatch({ type: 'SERVER_REACHABILITY_CHANGED', payload: isReachable });
        }
      });
    } catch (e) {
      log.warn('ApiClient not ready for connectivity subscription, deferring...', e);
    }

    // Retornamos el cleanup de ambos sensores
    return () => {
      log.debug('Unsubscribing from connectivity sensors...');
      unsubscribeNetInfo();
      try {
        apiClient.config({ onConnectivity: undefined });
      } catch (e) {
        // Ignorar errores en cleanup
      }
    };
  },

  /**
   * Suscribe a cambios de sesión en el AuthRepository.
   */
  subscribeToAuthSession(dispatch: (msg: CoreMsg) => void): () => void {
    const authRepo = getAuthRepo();
    return authRepo.onSessionChange((user) => {
      dispatch({
        type: 'SESSION_STATUS_CHANGED',
        payload: user ? 'AUTHENTICATED' : 'UNAUTHENTICATED'
      });
    });
  },

  /**
   * Suscribe a eventos de expiración de sesión.
   */
  subscribeToAuthExpired(dispatch: (msg: CoreMsg) => void): () => void {
    const authRepo = getAuthRepo();
    return authRepo.onSessionExpired((reason) => {
      dispatch({
        type: 'SESSION_EXPIRED',
        reason
      });
    });
  },

  /**
   * Tarea para sincronizar apuestas pendientes cuando se recupera la conexión.
   */
  syncPendingBetsTask(): Cmd {
    return Cmd.task({
      task: async () => {
        log.info('Network restored, attempting to sync pending bets...');
        return await betRepository.syncPending();
      },
      onSuccess: (res) => {
        log.info(`Auto-sync completed: ${res.success} success, ${res.failed} failed`);
        return { type: 'NO_OP' } as any;
      },
      onFailure: (err) => {
        log.error('Auto-sync failed', err);
        return { type: 'NO_OP' } as any;
      },
      label: 'SYNC_PENDING_BETS_ON_RECONNECT'
    });
  },

  syncPendingBetsOnStartupTask(): Cmd {
    return Cmd.task({
      task: async () => {
        log.info('Startup/session sync check for pending bets...');
        return await syncPendingBetsIfOnlineAndNeeded();
      },
      onSuccess: (res) => {
        if (res.skipped) {
          log.debug('Startup pending sync skipped', { reason: res.reason });
          return { type: 'NO_OP' } as any;
        }
        log.info(`Startup pending sync completed: ${res.success} success, ${res.failed} failed`);
        return { type: 'NO_OP' } as any;
      },
      onFailure: (err) => {
        log.error('Startup pending sync failed', err);
        return { type: 'NO_OP' } as any;
      },
      label: 'SYNC_PENDING_BETS_ON_STARTUP'
    });
  },

  /**
   * Inicializa el Worker de Sincronización global y registra sus estrategias.
   */
  initializeSyncWorker(): void {
    log.info('Initializing SyncWorker with domain strategies...');

    // 1. Registrar estrategias
    syncWorker.registerStrategy('bet', new BetPushStrategy());
    syncWorker.registerStrategy('dlq', new DlqPushStrategy());
    syncWorker.registerStrategy('draw', new DrawsPullStrategy());
    syncWorker.registerStrategy('telemetry', new TelemetryPushStrategy());

    // 2. Iniciar el worker (comenzará a procesar cuando haya conexión)
    syncWorker.start().catch(err => {
      log.error('Failed to start SyncWorker', err);
    });

    log.info('SyncWorker initialized successfully.');
  },

  /**
   * Tarea para inicializar el SyncWorker dentro del flujo de TEA.
   */
  initializeSyncWorkerTask(): Cmd {
    return Cmd.task({
      task: () => {
        this.initializeSyncWorker();
        return Promise.resolve();
      },
      onSuccess: () => ({ type: 'NO_OP' } as any),
      onFailure: (err) => {
        log.error('Failed task: initializeSyncWorker', err);
        return { type: 'NO_OP' } as any;
      },
      label: 'INITIALIZE_SYNC_WORKER'
    });
  },

  /**
   * Traduce un error técnico a un mensaje amigable para el usuario.
   * Delega la lógica al ApiClient/ErrorManager.
   */
  translateError(status: number, technicalMessage?: string): string {
    return apiClient.translateError(status, technicalMessage);
  }
};
