import { Model, DrawsListPluginConfig } from './model';
import * as Msg from './msg';
import { Return, ret } from '@/shared/core/return';
import { Cmd } from '@/shared/core/cmd';
import { match } from 'ts-pattern';
import { FilterDrawsUseCase } from './application/useCases/filter-draws.use-case';
import { StatusFilter } from './core/types';

const filterDrawsUseCase = new FilterDrawsUseCase();

export const update = (model: Model, msg: Msg.Msg): Return<Model, Msg.Msg> => {
  return match<Msg.Msg, Return<Model, Msg.Msg>>(msg)
    .with(Msg.INIT_CONTEXT.type(), (m) =>
      handleInitContext(model, m.payload))
    .with(Msg.SYNC_STATE.type(), (m) =>
      handleSyncState(model, m.payload))
    .with(Msg.FILTER_DRAWS.type(), () =>
      handleFilterDraws(model))
    .with(Msg.REFRESH_CLICKED.type(), () =>
      handlePublish(model, model.config.events.refresh))
    .with(Msg.RULES_CLICKED.type(), (m) =>
      handlePublish(model, model.config.events.rules, m.payload))
    .with(Msg.REWARDS_CLICKED.type(), (m) =>
      handlePublish(model, model.config.events.rewards, m.payload))
    .with(Msg.BETS_LIST_CLICKED.type(), (m) =>
      handlePublish(model, model.config.events.betsList, m.payload))
    .with(Msg.CREATE_BET_CLICKED.type(), (m) =>
      handlePublish(model, model.config.events.createBet, m.payload))
    .with(Msg.NOOP.type(), () =>
      ret(model, Cmd.none))
    .exhaustive();
};

function handleInitContext(
  model: Model,
  payload: { context: Model['context']; config: DrawsListPluginConfig }
): Return<Model, Msg.Msg> {
  return ret({ ...model, context: payload.context, config: payload.config }, Cmd.none);
}

function handleSyncState(
  model: Model,
  payload: { draws: Model['draws']; filter: string }
): Return<Model, Msg.Msg> {
  const needsUpdate = model.draws !== payload.draws || model.currentFilter !== payload.filter;

  if (!needsUpdate) {
    return ret(model, Cmd.none);
  }

  const nextModel = {
    ...model,
    draws: payload.draws,
    currentFilter: payload.filter
  };

  return ret(nextModel, Cmd.ofMsg(Msg.FILTER_DRAWS()));
}

function handleFilterDraws(model: Model): Return<Model, Msg.Msg> {
  if (model.draws.type !== 'Success') {
    console.log('[DrawsListPlugin] Skipping filter, draws state is:', model.draws.type);
    return ret({ ...model, filteredDraws: [] }, Cmd.none);
  }

  const filteredDraws = filterDrawsUseCase.execute({
    draws: model.draws.data,
    filter: model.currentFilter as StatusFilter
  });

  console.log('[DrawsListPlugin] Filtered draws:', filteredDraws.length, 'out of', model.draws.data.length, 'using filter:', model.currentFilter);

  return ret({ ...model, filteredDraws }, Cmd.none);
}

function handlePublish(
  model: Model,
  eventName: string,
  payload?: any
): Return<Model, Msg.Msg> {
  if (!model.context) return ret(model, Cmd.none);

  return ret(
    model,
    Cmd.task({
      task: async () => {
        model.context!.events.publish(eventName, payload);
        return null;
      },
      onSuccess: () => Msg.NOOP(),
      onFailure: () => Msg.NOOP()
    })
  );
}
