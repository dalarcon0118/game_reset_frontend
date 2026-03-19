import { createTEAModule } from '@core/engine/tea_module';
import { initialModel, Model, FiltersPluginConfig } from './model';
import { update } from './update';
import { subscriptions } from './subscriptions';
import { Msg, INIT_CONTEXT } from './msg';
import { PluginContext } from '@core/plugins/plugin.types';
import { Cmd } from '@core/tea-utils';

export interface FiltersPluginContext {
  context: PluginContext;
  config: FiltersPluginConfig;
}

export const FiltersPluginModule = createTEAModule<Model, Msg>({
  name: 'FiltersPlugin',
  initial: (pluginContext?: FiltersPluginContext) => {
    const [model, cmd] = initialModel();
    if (pluginContext) {
      return [
        { ...model, context: pluginContext.context, config: pluginContext.config },
        Cmd.ofMsg(INIT_CONTEXT({ context: pluginContext.context, config: pluginContext.config }))
      ];
    }
    return [model, cmd];
  },
  update,
  subscriptions
});

// Legacy compatibility exports
export const useFiltersPluginStore = FiltersPluginModule.useStore;
export const useFiltersPluginDispatch = FiltersPluginModule.useDispatch;
export const FiltersPluginProvider = FiltersPluginModule.Provider;

// Old API compatibility
export const selectModel = (state: { model: Model }) => state.model;
export const selectDispatch = (state: { dispatch: (msg: Msg) => void }) => state.dispatch;
