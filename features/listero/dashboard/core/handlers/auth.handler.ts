import { Model } from '../model';
import { Msg } from '../msg';
import { Cmd, CommandDescriptor } from '@/shared/core/cmd';
import { ret, singleton, Return } from '@/shared/core/return';
import { handleAuthUserSynced as logicHandleAuthUserSynced } from '../logic';
import { fetchDrawsCmd, fetchSummaryCmd, updateAuthTokenCmd, loadPendingBetsCmd } from '../commands';

export const AuthHandler = {
    handleAuthUserSynced: (model: Model, user: any): Return<Model, Msg> => {
        const { nextModel, shouldFetch, fetchId, shouldUpdateToken } = logicHandleAuthUserSynced(model, user);
        let cmds: CommandDescriptor[] = [];

        if (shouldFetch && fetchId) {
            console.log('update: AUTH_USER_SYNCED triggering fetch for', fetchId);
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
