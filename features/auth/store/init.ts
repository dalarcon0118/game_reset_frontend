// Auth store initialization - TEA-compliant init function
import { AuthModel, AuthMsg, AuthMsgType } from './types';
import { Cmd } from '../../../shared/core/tea-utils/cmd';
import { initialAuthModel } from './initial';

/**
 * Initialize auth store with saved username loading
 * This follows TEA pattern where init returns [Model, Cmd]
 * The Cmd will trigger loading of saved username from SecureStore
 */
export const initAuth = (): [AuthModel, Cmd] => {
    // Start with initial model and command to load saved username and check auth status
    return [
        initialAuthModel,
        Cmd.batch([
            Cmd.ofMsg({ type: AuthMsgType.LOAD_SAVED_USERNAME_REQUESTED }),
            Cmd.ofMsg({ type: AuthMsgType.CHECK_AUTH_STATUS_REQUESTED })
        ])
    ];
};