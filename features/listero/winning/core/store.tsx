import { createTEAModule, defineTeaModule } from '@core/engine/tea_module';
import { Cmd, ret, Return } from '@core/tea-utils';
import { WinningModel, WinningMsg, INIT_MODULE } from './types';
import { initialWinningModel } from './model';
import { update, subscriptions } from './update';

/**
 * 📦 WINNING MODULE DEFINITION
 * Implementa Elm Architecture con TEA
 */
export const winningDefinition = defineTeaModule<WinningModel, WinningMsg>({
  name: 'Winning',
  initial: (params?: { structureId?: string }): Return<WinningModel, WinningMsg> => {
    return ret(initialWinningModel, Cmd.ofMsg(INIT_MODULE(params?.structureId)));
  },
  update,
  subscriptions
});

/**
 * 🏪 WINNING MODULE INSTANCE
 */
export const WinningModule = createTEAModule(winningDefinition);

// Hooks públicos
export const useWinningStore = WinningModule.useStore;
export const useWinningDispatch = WinningModule.useDispatch;
export const WinningProvider = WinningModule.Provider;

// Selectors
export const selectWinningModel = (state: { model: WinningModel }) => state.model;
export const selectWinningDispatch = (state: { dispatch: (msg: WinningMsg) => void }) => state.dispatch;
