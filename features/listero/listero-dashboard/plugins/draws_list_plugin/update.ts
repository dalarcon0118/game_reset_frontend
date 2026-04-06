import { Model, DrawsListPluginConfig, DrawFinancialTotals, timeRef } from './model';
import * as Msg from './msg';
import { DrawTotalsUpdate } from './msg';
import { Return, ret, Cmd, RemoteData } from '@core/tea-utils';
import { match } from 'ts-pattern';
import { DASHBOARD_RULES_CLICKED, DASHBOARD_REWARDS_CLICKED, DASHBOARD_REFRESH_CLICKED } from '@/config/signals';
import { FilterDrawsUseCase } from './application/useCases/filter-draws.use-case';
import { StatusFilter, Draw } from './core/types';
import { logger } from '@/shared/utils/logger';
import { GameRegistry, GameIntent } from '@/shared/core/registry/game_registry';
import { TimerRepository } from '@/shared/repositories/system/time';

const log = logger.withTag('DRAWS_LIST_PLUGIN');

const filterDrawsUseCase = new FilterDrawsUseCase();

function handleNavigateToBetsList(
  model: Model,
  payload: { id: string | number; title: string; draw?: Draw }
): Return<Model, Msg.Msg> {
  // Intentamos obtener el tipo desde el objeto Draw (SSoT)
  const category = payload.draw ? GameRegistry.getCategoryByDraw(payload.draw) : GameRegistry.getCategoryByTitle(payload.title);
  const intent: GameIntent = category === 'loteria' ? 'LOTERIA_LIST' : 'BOLITA_LIST';
  const pathname = GameRegistry.resolveRouteByIntent(intent);

  return ret(
    model,
    Cmd.navigate({ pathname, params: { id: String(payload.id), title: payload.title } })
  );
}

function handleNavigateToCreateBet(
  model: Model,
  payload: { id: string | number; title: string; draw?: Draw }
): Return<Model, Msg.Msg> {
  const category = payload.draw ? GameRegistry.getCategoryByDraw(payload.draw) : GameRegistry.getCategoryByTitle(payload.title);
  const intent: GameIntent = category === 'loteria' ? 'LOTERIA_ANOTATE' : 'BOLITA_ANOTATE';
  const pathname = GameRegistry.resolveRouteByIntent(intent);

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
      ret(model, Cmd.sendMsg(DASHBOARD_REFRESH_CLICKED())))
    .with(Msg.RULES_CLICKED.type(), (m) =>
      ret(model, Cmd.sendMsg(DASHBOARD_RULES_CLICKED(m.payload))))
    .with(Msg.REWARDS_CLICKED.type(), (m) =>
      ret(model, Cmd.sendMsg(DASHBOARD_REWARDS_CLICKED(m.payload))))
    .with(Msg.BETS_LIST_CLICKED.type(), (m) =>
      handleNavigateToBetsList(model, m.payload))
    .with(Msg.CREATE_BET_CLICKED.type(), (m) =>
      handleNavigateToCreateBet(model, m.payload))
    .with(Msg.TICK.type(), (m) =>
      handleTick(model, m.payload))
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
  payload: { draws: Model['draws']; filter: string; summary: Model['summary']; commissionRate: number }
): Return<Model, Msg.Msg> {
  const currentDrawsData = (model.draws as any).data || [];
  const nextDrawsData = (payload.draws as any).data || [];

  log.debug('handleSyncState called', {
    currentDrawsType: model.draws.type,
    newDrawsType: payload.draws.type,
    drawsCount: nextDrawsData.length
  });

  // 🛡️ PROTECCIÓN CONTRA RE-MONTAJE:
  // Si el plugin ya tiene datos exitosos y el dashboard (payload) está en Loading/NotAsked,
  // NO pisamos nuestro estado local. Esto evita que la lista desaparezca y se quede el spinner
  // infinito del dashboard mientras el host vuelve a cargar.
  const isHostResetting = model.draws.type === 'Success' && payload.draws.type !== 'Success';

  if (isHostResetting) {
    log.info('🛡️ Protection: Host is resetting (NotAsked/Loading), keeping local Success data');
    // Solo actualizamos filtro y resumen si han cambiado, pero mantenemos nuestros draws
    return ret({
      ...model,
      currentFilter: payload.filter,
      summary: payload.summary,
      commissionRate: payload.commissionRate
    }, Cmd.none);
  }

  const needsUpdate =
    model.draws.type !== payload.draws.type ||
    (RemoteData.isSuccess(model.draws) && RemoteData.isSuccess(payload.draws) && currentDrawsData !== nextDrawsData) ||
    model.currentFilter !== payload.filter ||
    model.summary !== payload.summary ||
    model.commissionRate !== payload.commissionRate;

  // 🛡️ Siempre permitimos la sincronización si el estado actual es Loading/NotAsked
  // pero el host ya tiene datos exitosos.
  const shouldForceSync = model.draws.type !== 'Success' && payload.draws.type === 'Success';

  if (!needsUpdate && !shouldForceSync) {
    return ret(model, Cmd.none);
  }

  const nextModel = {
    ...model,
    draws: payload.draws,
    currentFilter: payload.filter,
    summary: payload.summary,
    commissionRate: payload.commissionRate
  };

  const drawsDataChanged =
    (RemoteData.isSuccess(model.draws) && RemoteData.isSuccess(payload.draws) && currentDrawsData !== nextDrawsData) ||
    model.draws.type !== payload.draws.type;

  const filterChanged = model.currentFilter !== payload.filter;

  if (drawsDataChanged || filterChanged) {
    return ret(nextModel, Cmd.ofMsg(Msg.FILTER_DRAWS()));
  }

  return ret(nextModel, Cmd.none);
}

function handleFilterDraws(model: Model): Return<Model, Msg.Msg> {
  if (model.draws.type !== 'Success') {
    log.debug('Skipping filter, draws state is:', model.draws.type);
    return ret({ ...model, filteredDraws: [] }, Cmd.none);
  }

  const trustedNow = timeRef.current;

  const filteredDraws = filterDrawsUseCase.execute({
    draws: model.draws.data,
    filter: model.currentFilter as StatusFilter,
    currentTime: trustedNow
  });

  const hasSameFilteredDraws =
    model.filteredDraws.length === filteredDraws.length &&
    model.filteredDraws.every((draw, i) => draw.id === (filteredDraws as Draw[])[i]?.id);

  if (hasSameFilteredDraws) {
    return ret(model, Cmd.none);
  }

  return ret({ ...model, filteredDraws: filteredDraws as Draw[] }, Cmd.none);
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
    timestamp: number;
  }
): Return<Model, Msg.Msg> {
  log.debug('Batch financial update input', {
    updates: payload.updates.length,
    currentMapSize: model.totalsByDrawId.size,
    timestamp: payload.timestamp
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
        lastUpdated: payload.timestamp,
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

function handleTick(model: Model, time: number): Return<Model, Msg.Msg> {
  if (model.draws.type !== 'Success') {
    return ret(model, Cmd.none);
  }

  const trustedNow = TimerRepository.getTrustedNow(time);
  timeRef.current = trustedNow;

  const hasExpiredDraw = model.draws.data.some(draw => {
    if (!draw.betting_end_time) return false;
    const endTime = new Date(draw.betting_end_time).getTime();
    if (trustedNow >= endTime) {
      return true;
    }
    return false;
  });

  if (hasExpiredDraw) {
    return ret(model, Cmd.ofMsg(Msg.FILTER_DRAWS()));
  }

  return ret(model, Cmd.none);
}
