import { FiltersPluginConfig, Model } from './model';
import * as Msg from './msg';
import { Return, ret } from '@/shared/core/return';
import { Cmd } from '@/shared/core/cmd';
import { match } from 'ts-pattern';
import { PluginContext } from '@/shared/core/plugins/plugin.types';

export const update = (model: Model, msg: Msg.Msg): Return<Model, Msg.Msg> => {
  return match<Msg.Msg, Return<Model, Msg.Msg>>(msg)
    .with(Msg.INIT_CONTEXT.type(), (m) =>
      handleInitContext(model, m.payload))
    .with(Msg.SELECT_FILTER.type(), (m) =>
      handleSelectFilter(model, m.payload))
    .with(Msg.SYNC_STATUS_FILTER.type(), (m) =>
      handleSyncStatusFilter(model, m.payload))
    .with(Msg.NOOP.type(), () =>
      ret(model, Cmd.none))
    .exhaustive();
};

function handleInitContext(
  model: Model,
  payload: { context: PluginContext; config: FiltersPluginConfig }
): Return<Model, Msg.Msg> {
  const { context, config } = payload;
  const statusFilter = context.hostStore.getState().model?.[config.stateKey] ?? config.defaultValue;
  return ret({ ...model, context, config, statusFilter }, Cmd.none);
}

function handleSelectFilter(model: Model, value: string): Return<Model, Msg.Msg> {
  const nextModel = { ...model, statusFilter: value };
  if (!model.context) return ret(nextModel, Cmd.none);

  return ret(
    nextModel,
    Cmd.task({
      task: async () => {
        model.context!.events.publish(model.config.eventName, value);
        return null;
      },
      onSuccess: () => Msg.NOOP(),
      onFailure: () => Msg.NOOP()
    })
  );
}

function handleSyncStatusFilter(model: Model, value: string): Return<Model, Msg.Msg> {
  if (model.statusFilter === value) return ret(model, Cmd.none);
  return ret({ ...model, statusFilter: value }, Cmd.none);
}
