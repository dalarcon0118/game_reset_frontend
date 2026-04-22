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
    log.debug('triggerInitialLoad evaluation', {
        status: model.status.type,
        userStructureId: model.userStructureId,
        drawsType: model.draws.type
    });

    // STATE MACHINE GUARD: Solo permitir carga si estamos en LOADING_DATA
    if (model.status.type !== 'LOADING_DATA') {
        log.debug('triggerInitialLoad skipped: Must be in LOADING_DATA state', { currentStatus: model.status.type });
        return singleton(model);
    }

    // 1. Basic Requirement: We need a user structure.
    if (!model.userStructureId) {
        log.debug('triggerInitialLoad skipped: No userStructureId');
        return singleton(model);
    }

    // 2. Data Status: Check if we need to fetch
    const needsFetch = 
        model.draws.type === 'NotAsked' || 
        model.draws.type === 'Failure' ||
        (model.draws.type === 'Loading' && !model.userStructureId); // Safety fallback

    if (!needsFetch) {
        if (model.draws.type === 'Success') {
            log.info('Data already loaded, transitioning to READY');
            return singleton({ ...model, status: { type: 'READY' } });
        }
        log.debug('triggerInitialLoad: already fetching or loaded');
        return singleton(model);
    }

    // 3. Ready to Fetch:
    log.info('Ready for initial fetch.');

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
            fetchDrawsCmd(model.userStructureId),
            loadPendingBetsCmd(),
            promotionCmd,
            timeoutRetryCmd
        ])
    );
};

export const AuthHandler = {
    handleAuthUserSynced: (model: Model, user: DashboardUser | null): Return<Model, Msg> => {
        log.info('[DIAGNOSTIC] handleAuthUserSynced', {
            hasUser: !!user,
            structureId: user?.structureId,
            commissionRate: user?.commissionRate,
            currentModelStatus: model.status.type
        });
        const nextModel = logicHandleAuthUserSynced(model, user);

        // Si estamos en LOADING_DATA y acabamos de recibir el structureId, disparamos la carga
        if (nextModel.status.type === 'LOADING_DATA' && nextModel.userStructureId) {
            log.info('User data synced while in LOADING_DATA state. Triggering initial load.');
            return triggerInitialLoad(nextModel);
        }

        return singleton(nextModel);
    },

    handleSystemReady: (model: Model, date: string, structureId?: string, user?: any): Return<Model, Msg> => {
        const adaptedUser = user ? adaptAuthUser(user) : null;

        log.info('SYSTEM_READY received from CoreModule. Context is guaranteed.', {
            date,
            structureId,
            hasUser: !!user,
            adaptedStructureId: adaptedUser?.structureId,
            adaptedCommissionRate: adaptedUser?.commissionRate
        });

        if (model.draws.type === 'Success' && model.status.type === 'READY') {
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
            return triggerInitialLoad(hydratedModel);
        }

        // Fallback: Si por alguna razón no vino en el payload, lo pedimos al repositorio
        log.info('SYSTEM_READY: userStructureId missing in payload. Fetching from AuthRepository...');
        return ret(hydratedModel, fetchUserDataCmd());
    },

    handleAuthTokenUpdated: (model: Model, token: string): Return<Model, Msg> => {
        if (!token) {
            log.warn('Received empty token in AUTH_TOKEN_UPDATED - ignoring update');
            return singleton(model);
        }

        const nextModel = { ...model, authToken: token };

        // Si estábamos esperando preparación de sesión, podemos continuar si ya tenemos el token
        // Pero la regla es: esperar a MAINTENANCE_COMPLETED
        log.info('Auth token updated, session preparation continues...');
        return singleton(nextModel);
    },

    handleSetUserStructure: (model: Model, id: string): Return<Model, Msg> => {
        return ret({ ...model, userStructureId: id }, [fetchDrawsCmd(id), loadPendingBetsCmd()] as Cmd);
    },

    handleToggleBalance: (model: Model): Return<Model, Msg> => {
        return singleton({ ...model, showBalance: !model.showBalance });
    }
};
