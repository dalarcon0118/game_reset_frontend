import { createTEAModule, defineTeaModule } from '@core/engine/tea_module';
import { Cmd, ret } from '@core/tea-utils';
import { WinningModel, WinningMsg, INIT_MODULE } from './types';
import { initialWinningModel } from './model';
import { update, subscriptions } from './update';

/**
 * 📦 WINNING MODULE DEFINITION
 * Implementa Elm Architecture con TEA
 */
export const winningDefinition = defineTeaModule<WinningModel, WinningMsg>({
  name: 'Winning',
  initial: (): [WinningModel, Cmd] => {
    // Estilo Elm: Init retorna [model, Cmd]
    // El Cmd dispatch INIT_MODULE que dispara FETCH_ALL_WINNING_DATA
    return ret(initialWinningModel, Cmd.ofMsg(INIT_MODULE()));
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
