import { Model, DrawsListPluginConfig, DrawFinancialTotals } from './model';
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
import { drawRepository } from '@/shared/repositories/draw';

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
    .with(Msg.REQUEST_LOCAL_DRAWS.type(), () =>
      handleRequestLocalDrawsCmd(model))
    .with(Msg.LOCAL_DRAWS_LOADED.type(), (m) =>
      handleLocalDrawsLoaded(model, m.payload))
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
    // SSOT: Totales financieros desde BetRepository
    .with(Msg.BATCH_OFFLINE_UPDATE.type(), (m) =>
      handleBatchFinancialUpdate(model, m.payload))
    .with(Msg.TICK.type(), () =>
      ret(model, Cmd.none))
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

function handleRequestLocalDrawsCmd(model: Model): Return<Model, Msg.Msg> {
  if (model.draws.type === 'Success' && model.draws.data.length > 0) {
    log.debug('handleRequestLocalDraws: already has data, skipping');
    return ret(model, Cmd.none);
  }

  const structureId = (model.context?.state as any)?.userStructureId;
  if (!structureId) {
    log.debug('handleRequestLocalDraws: no structureId available');
    return ret(model, Cmd.none);
  }

  return ret(
    { ...model, draws: RemoteData.loading() },
    Cmd.task({
      label: 'REQUEST_LOCAL_DRAWS',
      task: async () => {
        log.info('handleRequestLocalDraws: loading from drawRepository', { structureId });
        const result = await drawRepository.getDraws({ owner_structure: structureId });

        if (result.isOk() && result.value.length > 0) {
          const draws = result.value;
          const trustedNow = TimerRepository.getTrustedNow(Date.now());
          const filteredDraws = filterDrawsUseCase.execute({
            draws,
            filter: model.currentFilter as StatusFilter,
            currentTime: trustedNow
          });

          log.info('handleRequestLocalDraws: loaded from cache/repository', { count: draws.length });

          return Msg.LOCAL_DRAWS_LOADED({
            draws,
            filteredDraws
          });
        }

        log.debug('handleRequestLocalDraws: no data available');
        return Msg.LOCAL_DRAWS_LOADED({ draws: [], filteredDraws: [] });
      },
      onSuccess: (msg) => msg,
      onFailure: () => Msg.LOCAL_DRAWS_LOADED({ draws: [], filteredDraws: [] })
    })
  );
}

function handleLocalDrawsLoaded(
  model: Model,
  payload: { draws: Draw[]; filteredDraws: Draw[] }
): Return<Model, Msg.Msg> {
  // Si los datos vienen del backend, NO sobrescribirlos con datos locales
  if (model.dataSource === 'backend' && model.draws.type === 'Success') {
    log.debug('handleLocalDrawsLoaded: ⏭️ Skipping - backend data already loaded', {
      backendDrawsCount: (model.draws as any).data?.length
    });
    return ret(model, Cmd.none);
  }

  if (payload.draws.length > 0) {
    log.info('handleLocalDrawsLoaded: ✅ Draws loaded from local/repository', {
      totalDraws: payload.draws.length,
      filteredDraws: payload.filteredDraws.length
    });
    return ret(
      {
        ...model,
        draws: RemoteData.success(payload.draws),
        filteredDraws: payload.filteredDraws,
        dataSource: 'local'
      },
      Cmd.none
    );
  }

  log.debug('handleLocalDrawsLoaded: ⚠️ No draws available from local/repository', {
    previousState: model.draws.type,
    previousFilteredCount: model.filteredDraws.length
  });

  return ret(
    {
      ...model,
      filteredDraws: [],
      dataSource: model.dataSource ?? 'local'
    },
    Cmd.none
  );
}

function handleSyncState(
  model: Model,
  payload: { draws: Model['draws']; filter: string; summary: Model['summary']; commissionRate: number }
): Return<Model, Msg.Msg> {
  const currentDrawsData = (model.draws as any).data || [];
  const nextDrawsData = (payload.draws as any).data || [];

  log.info('handleSyncState (Input from Host):', {
    hostState: payload.draws.type,
    localState: model.draws.type,
    hostDrawsCount: nextDrawsData.length,
    localDrawsCount: currentDrawsData.length,
    filter: payload.filter,
    currentFilter: model.currentFilter,
    firstDrawFromHost: nextDrawsData[0] ? { id: nextDrawsData[0].id, status: nextDrawsData[0].status } : null
  });

  // 🛡️ PROTECCIÓN CONTRA RE-MONTAJE:
  // Si el plugin ya tiene datos exitosos y el dashboard (payload) está en Loading/NotAsked,
  // NO pisamos nuestro estado local. Esto evita que la lista desaparezca y se quede el spinner
  // infinito del dashboard mientras el host vuelve a cargar.
  const isHostResetting = model.draws.type === 'Success' && payload.draws.type !== 'Success';

  if (isHostResetting) {
    log.info('🛡️ Protection: Host is resetting (NotAsked/Loading), keeping local Success data', {
      localStatus: model.draws.type,
      hostStatus: payload.draws.type
    });
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
    commissionRate: payload.commissionRate,
    dataSource: payload.draws.type === 'Success' ? 'backend' : model.dataSource
  };

  const drawsDataChanged = RemoteData.isSuccess(model.draws) && RemoteData.isSuccess(payload.draws)
    ? hasDrawsDataChanged(currentDrawsData, nextDrawsData)
    : model.draws.type !== payload.draws.type;

  const filterChanged = model.currentFilter !== payload.filter;

  if (drawsDataChanged || filterChanged) {
    const nextModelWithFilter = { ...nextModel };

    if (nextModel.draws.type === 'Success') {
      const trustedNow = TimerRepository.getTrustedNow(Date.now());
      const filteredDraws = filterDrawsUseCase.execute({
        draws: nextModel.draws.data,
        filter: nextModel.currentFilter as StatusFilter,
        currentTime: trustedNow
      });
      nextModelWithFilter.filteredDraws = filteredDraws as Draw[];
      log.debug('handleSyncState: filteredDraws updated', {
        filterChanged,
        drawsDataChanged,
        newFilteredCount: filteredDraws.length
      });
    }

    return ret(nextModelWithFilter, Cmd.none);
  }

  return ret(nextModel, Cmd.none);
}

function hasDrawsDataChanged(currentDraws: any[], nextDraws: any[]): boolean {
  if (currentDraws.length !== nextDraws.length) return true;

  const currentKeys = currentDraws.map(d => `${d.id}-${d.status}-${d.betting_end_time}`);
  const nextKeys = nextDraws.map(d => `${d.id}-${d.status}-${d.betting_end_time}`);

  return JSON.stringify(currentKeys) !== JSON.stringify(nextKeys);
}

function handleFilterDraws(model: Model): Return<Model, Msg.Msg> {
  if (model.draws.type !== 'Success') {
    log.debug('Skipping filter, draws state is:', model.draws.type);
    return ret({ ...model, filteredDraws: [] }, Cmd.none);
  }

  const trustedNow = TimerRepository.getTrustedNow(Date.now());

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

  if (model.draws.type === 'Success') {
    const trustedNow = TimerRepository.getTrustedNow(payload.timestamp);
    const filteredDraws = filterDrawsUseCase.execute({
      draws: model.draws.data,
      filter: model.currentFilter as StatusFilter,
      currentTime: trustedNow
    });

    const hasSameFilteredDraws =
      model.filteredDraws.length === filteredDraws.length &&
      model.filteredDraws.every((draw, i) => draw.id === filteredDraws[i]?.id);

    if (!hasSameFilteredDraws) {
      return ret({ ...nextModel, filteredDraws }, Cmd.none);
    }
  }

  return ret(nextModel, Cmd.none);
}
