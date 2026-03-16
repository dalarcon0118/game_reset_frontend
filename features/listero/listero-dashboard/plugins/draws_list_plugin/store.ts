import { createTEAModule } from '@core/engine/tea_module';
import { initialModel, Model, DrawsListPluginConfig } from './model';
import { update } from './update';
import { subscriptions } from './subscriptions';
import { Msg, INIT_CONTEXT } from './msg';
import { PluginContext } from '@core/plugins/plugin.types';
import { Cmd } from '@core/tea-utils';

export const DrawsListModule = createTEAModule<Model, Msg>({
  name: 'DrawsListPlugin',
  initial: (params: { context: PluginContext; config: DrawsListPluginConfig }) => {
    const [model, cmd] = initialModel();
    if (params) {
      // Si hay params (contexto), inyectamos el mensaje de inicialización inmediatamente
      return [
        { ...model, context: params.context, config: params.config },
        Cmd.ofMsg(INIT_CONTEXT(params))
      ];
    }
    return [model, cmd];
  },
  update,
  subscriptions
});

export const selectModel = (state: { model: Model }) => state.model;
export const selectDispatch = (state: { dispatch: (msg: Msg) => void }) => state.dispatch;
