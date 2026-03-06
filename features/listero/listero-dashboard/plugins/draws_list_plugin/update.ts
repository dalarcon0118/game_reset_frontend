import { Model, DrawsListPluginConfig, DrawFinancialTotals, financialSelectors } from './model';
import * as Msg from './msg';
import { DrawTotalsUpdate } from './msg';
import { Return, ret, Cmd, RemoteData } from '@/shared/core/tea-utils';
import { match } from 'ts-pattern';
import { FilterDrawsUseCase } from './application/useCases/filter-draws.use-case';
import { StatusFilter, Draw } from './core/types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('DRAWS_LIST_PLUGIN');

const filterDrawsUseCase = new FilterDrawsUseCase();

function getDrawType(source: string): 'bolita' | 'loteria' {
  const normalized = (source || '').toLowerCase();
  if (normalized.includes('loteria') || normalized.includes('lotería')) {
    return 'loteria';
  }
  return 'bolita';
}

function handleNavigateToBetsList(
  model: Model,
  payload: { id: string | number; title: string }
): Return<Model, Msg.Msg> {
  const type = getDrawType(payload.title);
  const pathname = `/lister/bets/${type}/list`;

  return ret(
    model,
    Cmd.navigate({ pathname, params: { id: String(payload.id), title: payload.title } })
  );
}

function handleNavigateToCreateBet(
  model: Model,
  payload: { id: string | number; title: string }
): Return<Model, Msg.Msg> {
  const type = getDrawType(payload.title);
  const pathname = `/lister/bets/${type}/anotate`;

  return ret(
    model,
    Cmd.navigate({ pathname, params: { id: String(payload.id), title: payload.title } })
  );
}

// ============================================================================
// UPDATE PRINCIPAL
// ============================================================================

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
      handleNavigateToBetsList(model, m.payload))
    .with(Msg.CREATE_BET_CLICKED.type(), (m) =>
      handleNavigateToCreateBet(model, m.payload))
    // SSOT: Totales financieros desde BetRepository
    .with(Msg.BATCH_OFFLINE_UPDATE.type(), (m) =>
      handleBatchFinancialUpdate(model, m.payload))
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
  payload: { draws: Model['draws']; filter: string; summary: Model['summary'] }
): Return<Model, Msg.Msg> {
  const currentDrawsData = (model.draws as any).data || [];
  const nextDrawsData = (payload.draws as any).data || [];

  log.debug('handleSyncState called', {
    currentDrawsType: model.draws.type,
    newDrawsType: payload.draws.type,
    drawsCount: nextDrawsData.length
  });

  const needsUpdate =
    model.draws.type !== payload.draws.type ||
    (RemoteData.isSuccess(model.draws) && RemoteData.isSuccess(payload.draws) && currentDrawsData !== nextDrawsData) ||
    model.currentFilter !== payload.filter ||
    model.summary !== payload.summary;

  if (!needsUpdate) {
    return ret(model, Cmd.none);
  }

  const nextModel = {
    ...model,
    draws: payload.draws,
    currentFilter: payload.filter,
    summary: payload.summary
  };

  return ret(nextModel, Cmd.ofMsg(Msg.FILTER_DRAWS()));
}

function handleFilterDraws(model: Model): Return<Model, Msg.Msg> {
  if (model.draws.type !== 'Success') {
    log.debug('Skipping filter, draws state is:', model.draws.type);
    return ret({ ...model, filteredDraws: [] }, Cmd.none);
  }

  // 1. Aplicar filtro base
  const filteredDraws = filterDrawsUseCase.execute({
    draws: model.draws.data,
    filter: model.currentFilter as StatusFilter
  });

  // SSOT: No mezclamos datos - Draw y Totals son fuentes separadas
  // Los totales financieros están en model.totalsByDrawId
  // El componente DrawItem consultará ambos usando selectors

  return ret({ ...model, filteredDraws: filteredDraws as Draw[] }, Cmd.none);
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

// ============================================================================
// HANDLERS PARA TOTALES FINANCIEROS (SSOT)
// ============================================================================

/**
 * Maneja actualizaciones masivas de totales financieros desde BetRepository
 * SSOT: Los totales vienen de betRepository.getTotalsByDrawId()
 */
function handleBatchFinancialUpdate(
  model: Model,
  payload: {
    updates: DrawTotalsUpdate[];
  }
): Return<Model, Msg.Msg> {
  log.debug('Batch financial update input', {
    updates: payload.updates.length,
    currentMapSize: model.totalsByDrawId.size
  });

  const newTotalsByDrawId = new Map(model.totalsByDrawId);
  let deleted = 0;
  let upserted = 0;

  payload.updates.forEach(update => {
    if (update.betCount === 0) {
      newTotalsByDrawId.delete(update.drawId);
      deleted += 1;
    } else {
      const totals: DrawFinancialTotals = {
        drawId: update.drawId,
        totalCollected: update.totalCollected,
        premiumsPaid: update.premiumsPaid,
        netResult: update.netResult,
        betCount: update.betCount,
        lastUpdated: Date.now(),
      };
      newTotalsByDrawId.set(update.drawId, totals);
      upserted += 1;
    }
  });

  log.debug('Batch financial update intermediate', {
    upserted,
    deleted
  });

  const nextModel: Model = {
    ...model,
    totalsByDrawId: newTotalsByDrawId,
  };

  log.debug('Batch financial update final', {
    nextMapSize: nextModel.totalsByDrawId.size
  });

  // Refiltrar para actualizar la vista con los nuevos totales
  if (model.draws.type === 'Success') {
    return ret(nextModel, Cmd.ofMsg(Msg.FILTER_DRAWS()));
  }

  return ret(nextModel, Cmd.none);
}
