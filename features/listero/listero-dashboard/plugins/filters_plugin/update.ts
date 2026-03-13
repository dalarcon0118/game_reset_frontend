import { FiltersPluginConfig, Model } from './model';
import * as Msg from './msg';
import { Return, ret, Cmd } from '@core/tea-utils';
import { match } from 'ts-pattern';
import { PluginContext } from '@core/plugins/plugin.types';
import { DASHBOARD_FILTER_CHANGED } from '@/config/signals';

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
  
  // Enviamos la señal global para que cualquier interesado (como el Dashboard) se actualice.
  // Esto reemplaza el uso del EventBus imperativo por señales puras de TEA.
  return ret(
    nextModel,
    Cmd.sendMsg(DASHBOARD_FILTER_CHANGED(value))
  );
}

function handleSyncStatusFilter(model: Model, value: string): Return<Model, Msg.Msg> {
  if (model.statusFilter === value) return ret(model, Cmd.none);
  return ret({ ...model, statusFilter: value }, Cmd.none);
}
