import { Model } from '../model';
import { Msg } from '../msg';
import { Cmd, CommandDescriptor } from '@/shared/core/cmd';
import { ret, singleton, Return } from '@/shared/core/return';
import { handleAuthUserSynced as logicHandleAuthUserSynced } from '../logic';
import { fetchDrawsCmd, fetchSummaryCmd, updateAuthTokenCmd, loadPendingBetsCmd } from '../commands';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('DASHBOARD_AUTH_HANDLER');

export const AuthHandler = {
    handleAuthUserSynced: (model: Model, user: any): Return<Model, Msg> => {
        // We rely on the logic handler to decide if we need to fetch or update
        // It checks for data presence (hasDataOrLoading) and structure changes
        const { nextModel, shouldFetch, fetchId, shouldUpdateToken } = logicHandleAuthUserSynced(model, user);
        let cmds: CommandDescriptor[] = [];

        if (shouldFetch && fetchId) {
            log.debug('Auth user synced triggering fetch', { fetchId });
            cmds.push(fetchDrawsCmd(fetchId) as any);
            cmds.push(fetchSummaryCmd(fetchId) as any);
            cmds.push(loadPendingBetsCmd() as any);
        }

        if (shouldUpdateToken) {
            cmds.push(updateAuthTokenCmd() as any);
        }

        return ret(nextModel, cmds as any);
    },

    handleAuthTokenUpdated: (model: Model, token: string): Return<Model, Msg> => {
        if (model.authToken === token) {
            return singleton(model);
        }
        return singleton({ ...model, authToken: token });
    },

    handleSetUserStructure: (model: Model, id: string): Return<Model, Msg> => {
        return ret({ ...model, userStructureId: id }, [fetchDrawsCmd(id), fetchSummaryCmd(id), loadPendingBetsCmd()] as Cmd);
    },

    handleToggleBalance: (model: Model): Return<Model, Msg> => {
        return singleton({ ...model, showBalance: !model.showBalance });
    }
};
