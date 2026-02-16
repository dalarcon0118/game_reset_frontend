import { Model, DrawsListPluginConfig, DrawOfflineState } from './model';
import * as Msg from './msg';
import { Return, ret } from '@/shared/core/return';
import { Cmd } from '@/shared/core/cmd';
import { match } from 'ts-pattern';
import { FilterDrawsUseCase } from './application/useCases/filter-draws.use-case';
import { StatusFilter, Draw } from './core/types';
import { RemoteData } from '@/shared/core/remote.data';
import { logger } from '@/shared/utils/logger';
import { enrichDraws } from '../../core/logic';

const log = logger.withTag('DRAWS_LIST_PLUGIN');

const filterDrawsUseCase = new FilterDrawsUseCase();

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
      handlePublish(model, model.config.events.betsList, m.payload))
    .with(Msg.CREATE_BET_CLICKED.type(), (m) =>
      handlePublish(model, model.config.events.createBet, m.payload))
    // Fase 4: Mensajes offline
    .with(Msg.OFFLINE_STATE_UPDATED.type(), (m) =>
      handleOfflineStateUpdated(model, m.payload))
    .with(Msg.SYNC_OFFLINE_STATES.type(), () =>
      handleSyncOfflineStates(model))
    .with(Msg.BATCH_OFFLINE_UPDATE.type(), (m) =>
      handleBatchOfflineUpdate(model, m.payload))
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
  payload: { draws: Model['draws']; filter: string; summary: Model['summary']; pendingBets: Model['pendingBets']; syncedBets: Model['syncedBets'] }
): Return<Model, Msg.Msg> {
  const needsUpdate =
    model.draws !== payload.draws ||
    model.currentFilter !== payload.filter ||
    model.summary !== payload.summary ||
    model.pendingBets !== payload.pendingBets ||
    model.syncedBets !== payload.syncedBets;

  if (!needsUpdate) {
    return ret(model, Cmd.none);
  }

  const nextModel = {
    ...model,
    draws: payload.draws,
    currentFilter: payload.filter,
    summary: payload.summary,
    pendingBets: payload.pendingBets,
    syncedBets: payload.syncedBets
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

  // 2. Enriquecer con datos financieros (summary + pendingBets + syncedBets)
  // Nota: Draw de plugins/draws_list_plugin/core/types.ts es compatible con DrawType de shared/services/draw/types.ts
  const enrichedDraws = enrichDraws(
    filteredDraws as any,
    model.summary,
    model.pendingBets,
    model.syncedBets
  );

  log.debug('Filtered and enriched draws', {
    filteredCount: filteredDraws.length,
    totalCount: model.draws.data.length,
    filter: model.currentFilter,
    hasSummary: !!model.summary,
    pendingBetsCount: model.pendingBets.length,
    syncedBetsCount: model.syncedBets.length
  });

  return ret({ ...model, filteredDraws: enrichedDraws as any }, Cmd.none);
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
// HANDLERS OFFLINE (Fase 4)
// ============================================================================

/**
 * Maneja la actualización del estado offline de un sorteo
 * Actualiza el mapa de estados offline y recalcula los draws filtrados
 */
function handleOfflineStateUpdated(
  model: Model,
  payload: { drawId: string; localTotalCollected: number; localNetResult: number; pendingCount: number }
): Return<Model, Msg.Msg> {
  const newOfflineStates = new Map(model.offlineStates);

  if (payload.pendingCount === 0) {
    // Si no hay pendientes, eliminar el estado
    newOfflineStates.delete(payload.drawId);
  } else {
    // Actualizar o crear el estado
    const offlineState: DrawOfflineState = {
      drawId: payload.drawId,
      localTotalCollected: payload.localTotalCollected,
      localNetResult: payload.localNetResult,
      pendingCount: payload.pendingCount,
      lastUpdated: Date.now(),
    };
    newOfflineStates.set(payload.drawId, offlineState);
  }

  const hasPendingChanges = newOfflineStates.size > 0;

  // Actualizar el modelo con los nuevos estados offline
  const nextModel: Model = {
    ...model,
    offlineStates: newOfflineStates,
    hasPendingOfflineChanges: hasPendingChanges,
  };

  // Si tenemos draws cargados, enriquecerlos con datos offline
  if (model.draws.type === 'Success') {
    return ret(nextModel, Cmd.ofMsg(Msg.FILTER_DRAWS()));
  }

  return ret(nextModel, Cmd.none);
}

/**
 * Sincroniza todos los estados offline con el servicio
 * Se ejecuta al inicializar o cuando hay cambios globales
 */
function handleSyncOfflineStates(model: Model): Return<Model, Msg.Msg> {
  // Este handler se usa para forzar una sincronización completa
  // En la práctica, las suscripciones manejan los cambios automáticamente
  log.debug('Sync offline states requested');

  // Verificar si hay cambios pendientes
  const hasPendingChanges = model.offlineStates.size > 0;

  if (hasPendingChanges !== model.hasPendingOfflineChanges) {
    return ret({ ...model, hasPendingOfflineChanges: hasPendingChanges }, Cmd.none);
  }

  return ret(model, Cmd.none);
}

/**
 * Maneja actualizaciones masivas de estados offline (batch)
 * Útil para sincronizar múltiples sorteos a la vez
 */
function handleBatchOfflineUpdate(
  model: Model,
  payload: { updates: { drawId: string; localTotalCollected: number; localNetResult: number; pendingCount: number }[] }
): Return<Model, Msg.Msg> {
  const newOfflineStates = new Map(model.offlineStates);

  payload.updates.forEach(update => {
    if (update.pendingCount === 0) {
      newOfflineStates.delete(update.drawId);
    } else {
      const offlineState: DrawOfflineState = {
        drawId: update.drawId,
        localTotalCollected: update.localTotalCollected,
        localNetResult: update.localNetResult,
        pendingCount: update.pendingCount,
        lastUpdated: Date.now(),
      };
      newOfflineStates.set(update.drawId, offlineState);
    }
  });

  const hasPendingChanges = newOfflineStates.size > 0;

  const nextModel: Model = {
    ...model,
    offlineStates: newOfflineStates,
    hasPendingOfflineChanges: hasPendingChanges,
  };

  // Refiltrar si tenemos datos
  if (model.draws.type === 'Success') {
    return ret(nextModel, Cmd.ofMsg(Msg.FILTER_DRAWS()));
  }

  return ret(nextModel, Cmd.none);
}

// ============================================================================
// HELPERS PARA ENRIQUECER DRAWS CON DATOS OFFLINE
// ============================================================================

/**
 * Enriquece un draw con los datos offline si existen
 * Esta función pura se usa en los componentes para obtener datos combinados
 */
export function enrichDrawWithOfflineData(
  draw: Draw,
  offlineStates: Map<string, DrawOfflineState>
): Draw {
  const drawId = draw.id.toString();
  const offlineState = offlineStates.get(drawId);

  if (!offlineState || offlineState.pendingCount === 0) {
    return draw;
  }

  return {
    ...draw,
    totalCollected: (draw.totalCollected ?? 0) + offlineState.localTotalCollected,
    netResult: (draw.netResult ?? 0) + offlineState.localNetResult,
    // Agregar metadata offline para indicadores visuales
    _offline: {
      pendingCount: offlineState.pendingCount,
      localTotalCollected: offlineState.localTotalCollected,
      localNetResult: offlineState.localNetResult,
    },
  } as Draw & { _offline?: { pendingCount: number; localTotalCollected: number; localNetResult: number } };
}
