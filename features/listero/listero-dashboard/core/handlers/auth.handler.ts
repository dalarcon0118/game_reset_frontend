import { Model } from '../model';
import { Msg } from '../msg';
import { Cmd, CommandDescriptor } from '@/shared/core/cmd';
import { ret, singleton, Return } from '@/shared/core/return';
import { handleAuthUserSynced as logicHandleAuthUserSynced } from '../logic';
import { fetchDrawsCmd, fetchSummaryCmd, updateAuthTokenCmd, loadPendingBetsCmd } from '../commands';
import { logger } from '@/shared/utils/logger';
import { DashboardUser } from '../user.dto';
import { RemoteData } from '@/shared/core/remote.data';

const log = logger.withTag('DASHBOARD_AUTH_HANDLER');

const triggerInitialLoad = (model: Model): Return<Model, Msg> => {
    // 1. Basic Requirement: We need a user structure.
    if (!model.userStructureId) {
        log.debug('triggerInitialLoad skipped: No userStructureId');
        return singleton(model);
    }

    // 2. Data Status: Check if we need to fetch
    const needsFetch = model.draws.type === 'NotAsked' || model.summary.type === 'NotAsked';

    log.debug('triggerInitialLoad check', {
        userStructureId: model.userStructureId,
        hasToken: !!model.authToken,
        drawsType: model.draws.type,
        summaryType: model.summary.type,
        needsFetch
    });

    if (!needsFetch) return singleton(model);

    // 3. Ready to Fetch:
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
        // We rely on the logic handler to decide if we need to reset data
        // It checks for data presence (hasDataOrLoading) and structure changes
        const nextModel = logicHandleAuthUserSynced(model, user);

        // Always try to trigger load if conditions are met
        return triggerInitialLoad(nextModel);
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
