import { Model } from '../model';
import { Msg } from '../msg';
import { Cmd, CommandDescriptor } from '@/shared/core/tea-utils/cmd';
import { ret, singleton, Return } from '@/shared/core/return';
import { handleAuthUserSynced as logicHandleAuthUserSynced } from '../logic';
import { fetchDrawsCmd, fetchSummaryCmd, updateAuthTokenCmd, loadPendingBetsCmd, prepareDailySessionCmd } from '../commands';
import { logger } from '@/shared/utils/logger';
import { DashboardUser } from '../user.dto';
import { RemoteData } from '@/shared/core/tea-utils/remote.data';

const log = logger.withTag('DASHBOARD_AUTH_HANDLER');

const triggerDailyPreparation = (model: Model): Return<Model, Msg> => {
    console.log('[DEBUG] triggerDailyPreparation: INICIANDO...');
    log.info('Triggering daily session preparation before load...');
    return ret(model, prepareDailySessionCmd());
};

const triggerInitialLoad = (model: Model): Return<Model, Msg> => {
    console.log('[DEBUG] triggerInitialLoad: INICIANDO...');
    console.log('[DEBUG] triggerInitialLoad: model.userStructureId =', model.userStructureId);
    console.log('[DEBUG] triggerInitialLoad: model.draws.type =', model.draws.type);
    console.log('[DEBUG] triggerInitialLoad: model.summary.type =', model.summary.type);
    // 1. Basic Requirement: We need a user structure.
    if (!model.userStructureId) {
        console.log('[DEBUG] triggerInitialLoad: SALTADO - No userStructureId');
        log.debug('triggerInitialLoad skipped: No userStructureId');
        return singleton(model);
    }

    // 2. Data Status: Check if we need to fetch
    const needsFetch = model.draws.type === 'NotAsked' || model.summary.type === 'NotAsked';
    console.log('[DEBUG] triggerInitialLoad: needsFetch =', needsFetch);

    log.debug('triggerInitialLoad check', {
        userStructureId: model.userStructureId,
        hasToken: !!model.authToken,
        drawsType: model.draws.type,
        summaryType: model.summary.type,
        needsFetch
    });

    if (!needsFetch) {
        console.log('[DEBUG] triggerInitialLoad: SALTADO - No needsFetch');
        return singleton(model);
    }

    // 3. Ready to Fetch:
    console.log('[DEBUG] triggerInitialLoad: PROCEDIENDO A FETCH - Structure ready');
    log.info('Structure ready. Triggering initial fetch (parallel with token update).');

    // Set to loading immediately to prevent duplicate fetches
    const loadingModel: Model = {
        ...model,
        draws: RemoteData.loading(),
        summary: RemoteData.loading()
    };

    return ret(
        loadingModel,
        Cmd.batch([
            // Update token in parallel to ensure freshness
            updateAuthTokenCmd(),
            fetchDrawsCmd(model.userStructureId),
            fetchSummaryCmd(model.userStructureId),
            loadPendingBetsCmd()
        ])
    );
};

export const AuthHandler = {
    handleAuthUserSynced: (model: Model, user: DashboardUser | null): Return<Model, Msg> => {
        console.log('[DEBUG] handleAuthUserSynced: INICIANDO con user =', user ? user.id : 'null');
        console.log('[DEBUG] handleAuthUserSynced: user.structureId =', user?.structureId);
        // We rely on the logic handler to decide if we need to reset data
        const nextModel = logicHandleAuthUserSynced(model, user);
        console.log('[DEBUG] handleAuthUserSynced: nextModel.userStructureId =', nextModel.userStructureId);

        if (!nextModel.userStructureId) {
            console.log('[DEBUG] handleAuthUserSynced: RETORNANDO sin fetch - No userStructureId');
            return singleton(nextModel);
        }

        // If we need to fetch data, we first prepare the daily session
        const needsFetch = nextModel.draws.type === 'NotAsked' || nextModel.summary.type === 'NotAsked';
        console.log('[DEBUG] handleAuthUserSynced: needsFetch =', needsFetch);
        if (needsFetch) {
            console.log('[DEBUG] handleAuthUserSynced: LLAMANDO triggerDailyPreparation');
            return triggerDailyPreparation(nextModel);
        }

        console.log('[DEBUG] handleAuthUserSynced: LLAMANDO triggerInitialLoad');
        return triggerInitialLoad(nextModel);
    },

    handleDailySessionPrepared: (model: Model, success: boolean): Return<Model, Msg> => {
        console.log('[DEBUG] handleDailySessionPrepared: success =', success);
        log.info('Daily session prepared, now triggering initial load', { success });
        return triggerInitialLoad(model);
    },

    handleAuthTokenUpdated: (model: Model, token: string): Return<Model, Msg> => {
        if (model.authToken === token) {
            // Even if token is same, we should check if load is pending
            // (e.g. if structure arrived after token was set)
            return triggerInitialLoad(model);
        }

        const nextModel = { ...model, authToken: token };
        return triggerInitialLoad(nextModel);
    },

    handleSetUserStructure: (model: Model, id: string): Return<Model, Msg> => {
        return ret({ ...model, userStructureId: id }, [fetchDrawsCmd(id), fetchSummaryCmd(id), loadPendingBetsCmd()] as Cmd);
    },

    handleToggleBalance: (model: Model): Return<Model, Msg> => {
        return singleton({ ...model, showBalance: !model.showBalance });
    }
};
