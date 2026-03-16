import { createTEAModule } from '@core/engine/tea_module';
import { initialModel, LoginModel } from './model';
import { update } from './update';
import { LoginMsg, HYDRATION_STARTED } from './msg';
import { subscriptions } from './subscriptions';
import { ret } from '@core/tea-utils/return';
import { Cmd } from '@core/tea-utils/cmd';

export const LoginModule = createTEAModule<LoginModel, LoginMsg>({
    name: 'login-ui-v1',
    initial: () => ret(initialModel, Cmd.ofMsg(HYDRATION_STARTED())),
    update,
    subscriptions,
});

export const useLoginStore = LoginModule.useStore;
