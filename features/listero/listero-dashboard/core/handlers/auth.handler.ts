import { Model } from '../model';
import { Msg } from '../msg';
import { Cmd, ret, singleton, Return, RemoteData } from '@core/tea-utils';
import { handleAuthUserSynced as logicHandleAuthUserSynced } from '../logic';
import { fetchDrawsCmd, loadPendingBetsCmd, fetchUserDataCmd } from '../commands';
import { fetchPromotionsCmd } from '../../../../../shared/components/promotion/services/DataServices';
import { PROMOTION_MSG } from '../msg';
import { logger } from '@/shared/utils/logger';
import { adaptAuthUser, DashboardUser } from '../user.dto';

const log = logger.withTag('DASHBOARD_AUTH_HANDLER');

const INITIAL_LOAD_TIMEOUT_MS = 15000;

export const triggerInitialLoad = (model: Model): Return<Model, Msg> => {
    // STATE MACHINE GUARD: Solo permitir carga si estamos en LOADING_DATA
    if (model.status.type !== 'LOADING_DATA') {
        log.debug('[FLOW] triggerInitialLoad skipped: Must be in LOADING_DATA state', { currentStatus: model.status.type });
        return singleton(model);
    }

    // 1. Basic Requirement: We need a user structure.
    if (!model.userStructureId) {
        log.warn('[FLOW] triggerInitialLoad skipped: No userStructureId');
        return singleton(model);
    }

    // 1. Basic Requirement: We need a user structure.
    if (!model.userStructureId) {
        log.warn('[FLOW] triggerInitialLoad skipped: No userStructureId');
        return singleton(model);
    }

    // 2. Data Status: Check if we need to fetch
    const needsFetch =
        model.draws.type === 'NotAsked' ||
        model.draws.type === 'Failure' ||
        (model.draws.type === 'Loading' && !model.userStructureId); // Safety fallback

    if (!needsFetch) {
        if (model.draws.type === 'Success') {
            log.info('[FLOW] Data already loaded, transitioning to READY');
            return singleton({ ...model, status: { type: 'READY' } });
        }
        log.debug('[FLOW] triggerInitialLoad: already fetching or loaded');
        return singleton(model);
    }

    // 3. Ready to Fetch:
    log.info('[FLOW] Ready for initial fetch. Loading draws and pending bets...');

    // Set draws to loading
    const finalModel: Model = {
        ...model,
        draws: RemoteData.loading()
    };

    // Only load promotions if user doesn't need to change password
    const promotionCmd = model.needsPasswordChange
        ? Cmd.none
        : Cmd.map(PROMOTION_MSG, fetchPromotionsCmd());

    // DEFENSIVE: Agregar timeout para retry automático si no hay respuesta
    // Esto previene que el Dashboard quede sin datos si el primer intento falha silenciosamente
    const timeoutRetryCmd = Cmd.sleep(INITIAL_LOAD_TIMEOUT_MS, { type: 'RETRY_INITIAL_LOAD' as const });

    return ret(
        finalModel,
        Cmd.batch([
            fetchDrawsCmd(model.userStructureId, model.commissionRate),
            loadPendingBetsCmd(),
            promotionCmd,
            timeoutRetryCmd
        ])
    );
};

export const AuthHandler = {
  handleAuthUserSynced: (model: Model, user: DashboardUser | null): Return<Model, Msg> => {
    log.info('[FLOW] handleAuthUserSynced', {
      hasUser: !!user,
      structureId: user?.structureId,
      commissionRate: user?.commissionRate,
      currentModelStatus: model.status.type
    });
    const nextModel = logicHandleAuthUserSynced(model, user);

    // Root cause: If we're in LOADING_DATA state and receive user data with structureId,
    // trigger the initial load. This fixes the race condition where SYSTEM_READY arrived 
    // without user, then AUTH_USER_SYNCED arrived after user was hydrated.
    // (Previously this check was missing - the flow required handleSystemReady 
    // to call fetchUserDataCmd which then waited for AUTH_USER_SYNCED)
    if (model.status.type === 'LOADING_DATA' && nextModel.userStructureId) {
      log.info('[FLOW] handleAuthUserSynced: User arrived while in LOADING_DATA, triggering initial load.');
      return triggerInitialLoad(nextModel);
    }

    return singleton(nextModel);
  },

    handleSystemReady: (model: Model, date: string, structureId?: string, user?: any): Return<Model, Msg> => {
        const adaptedUser = user ? adaptAuthUser(user) : null;

        log.info('[FLOW] SYSTEM_READY received from CoreModule. Context is guaranteed.', {
            date,
            structureId,
            hasUser: !!user,
            adaptedStructureId: adaptedUser?.structureId,
            adaptedCommissionRate: adaptedUser?.commissionRate
        });

        if (model.draws.type === 'Success' && model.status.type === 'READY') {
            log.info('[FLOW] SYSTEM_READY: Data already loaded, skipping');
            return singleton(model);
        }

        // Si recibimos el contexto en el mensaje, lo inyectamos directamente
        const updatedModel: Model = {
            ...model,
            status: { type: 'LOADING_DATA' },
            userStructureId: structureId || adaptedUser?.structureId || model.userStructureId
        };
        const hydratedModel = adaptedUser ? logicHandleAuthUserSynced(updatedModel, adaptedUser) : updatedModel;

        // Si ya tenemos el ID (vía payload o previo), procedemos.
        if (hydratedModel.userStructureId) {
            log.info('[FLOW] SYSTEM_READY: Proceeding to triggerInitialLoad');
            return triggerInitialLoad(hydratedModel);
        }

        // Fallback: Si por alguna razón no vino en el payload, lo pedimos al repositorio
        log.info('[FLOW] SYSTEM_READY: userStructureId missing in payload. Fetching from AuthRepository...');
        return ret(hydratedModel, fetchUserDataCmd());
    },

    handleAuthTokenUpdated: (model: Model, token: string): Return<Model, Msg> => {
        if (!token) {
            log.warn('[FLOW] Received empty token in AUTH_TOKEN_UPDATED - ignoring update');
            return singleton(model);
        }

        const nextModel = { ...model, authToken: token };

        // Si estábamos esperando preparación de sesión, podemos continuar si ya tenemos el token
        // Pero la regla es: esperar a MAINTENANCE_COMPLETED
        log.info('[FLOW] Auth token updated, session preparation continues (waiting for SYSTEM_READY)...');
        return singleton(nextModel);
    },

    handleSetUserStructure: (model: Model, id: string): Return<Model, Msg> => {
        log.info('[FLOW] handleSetUserStructure', { structureId: id });
        return ret({ ...model, userStructureId: id }, [fetchDrawsCmd(id, model.commissionRate), loadPendingBetsCmd()] as Cmd);
    },

    handleToggleBalance: (model: Model): Return<Model, Msg> => {
        return singleton({ ...model, showBalance: !model.showBalance });
    }
};
