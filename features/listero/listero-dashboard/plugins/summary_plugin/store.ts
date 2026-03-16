import { createTEAModule } from '@core/engine/tea_module';
import { initialModel, Model } from './model';
import { update } from './update';
import { subscriptions } from './subscriptions';
import { Msg, INIT_CONTEXT } from './msg';
import { SummaryPluginContext } from './domain/models';
import { Cmd } from '@core/tea-utils';

export const SummaryModule = createTEAModule<Model, Msg>({
  name: 'SummaryPlugin',
  initial: (context: SummaryPluginContext) => {
    const [model, cmd] = initialModel();
    if (context) {
      return [
        { ...model, context },
        Cmd.ofMsg(INIT_CONTEXT(context))
      ];
    }
    return [model, cmd];
  },
  update,
  subscriptions
});

export const selectModel = (state: { model: Model }) => state.model;
export const selectDispatch = (state: { dispatch: (msg: Msg) => void }) => state.dispatch;
