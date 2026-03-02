import { Model, DrawsListPluginConfig, DrawOfflineState } from './model';
import * as Msg from './msg';
import { Return, ret } from '@/shared/core/return';
import { Cmd } from '@/shared/core/cmd';
import { match } from 'ts-pattern';
import { FilterDrawsUseCase } from './application/useCases/filter-draws.use-case';
import { StatusFilter, Draw } from './core/types';
import { RemoteData } from '@/shared/core/remote.data';
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
    // Fase 4: Mensajes offline
    .with(Msg.OFFLINE_STATE_UPDATED.type(), (m) =>
      handleOfflineUpdate(model, m.payload))
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

  // 2. Enriquecer EXCLUSIVAMENTE con datos del Ledger local (SSOT)
  // Ignoramos completamente los datos financieros del servidor y los de conciliación antigua.
  const fullyEnrichedDraws = (filteredDraws as any[]).map(draw =>
    enrichDrawWithOfflineData(draw as Draw, model.offlineStates)
  );

  return ret({ ...model, filteredDraws: fullyEnrichedDraws as Draw[] }, Cmd.none);
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
function handleOfflineUpdate(
  model: Model,
  payload: {
    drawId: string;
    localAmount: number;
    localCredits: number;
    localDebits: number;
    localNetResult: number;
    pendingCount: number
  }
): Return<Model, Msg.Msg> {
  const newOfflineStates = new Map(model.offlineStates);

  if (payload.pendingCount === 0) {
    newOfflineStates.delete(payload.drawId);
  } else {
    const offlineState: DrawOfflineState = {
      drawId: payload.drawId,
      localAmount: payload.localAmount,
      localCredits: payload.localCredits,
      localDebits: payload.localDebits,
      localNetResult: payload.localNetResult,
      pendingCount: payload.pendingCount,
      lastUpdated: Date.now(),
    };
    newOfflineStates.set(payload.drawId, offlineState);
  }

  const hasPendingChanges = newOfflineStates.size > 0;

  const nextModel: Model = {
    ...model,
    offlineStates: newOfflineStates,
    hasPendingOfflineChanges: hasPendingChanges,
  };

  // Forzar refiltrado de sorteos si ya tenemos datos cargados
  // Esto asegura que la vista vea los datos enriquecidos inmediatamente
  if (model.draws.type === 'Success') {
    return ret(nextModel, Cmd.ofMsg(Msg.FILTER_DRAWS()));
  }

  return ret(model, Cmd.none);
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
  payload: {
    updates: {
      drawId: string;
      localAmount: number;
      localCredits: number;
      localDebits: number;
      localNetResult: number;
      pendingCount: number
    }[]
  }
): Return<Model, Msg.Msg> {
  const newOfflineStates = new Map(model.offlineStates);

  payload.updates.forEach(update => {
    if (update.pendingCount === 0) {
      newOfflineStates.delete(update.drawId);
    } else {
      const offlineState: DrawOfflineState = {
        drawId: update.drawId,
        localAmount: update.localAmount,
        localCredits: update.localCredits,
        localDebits: update.localDebits,
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
 * ESTRATEGIA: Fuente Única de Verdad (SSOT) del Ledger Local.
 * Ignoramos los datos financieros del servidor para este reporte.
 */
export function enrichDrawWithOfflineData(
  draw: Draw,
  offlineStates: Map<string, DrawOfflineState>
): Draw {
  const drawId = draw.id.toString();
  const offlineState = offlineStates.get(drawId);

  // Valores por defecto del Ledger (SSOT)
  const localCredits = offlineState?.localCredits ?? 0;
  const localDebits = offlineState?.localDebits ?? 0;
  const localNet = offlineState?.localNetResult ?? 0;
  const pendingCount = offlineState?.pendingCount ?? 0;

  // Los montos del backend se guardan solo para referencia/debug si se desea,
  // pero NO se usan para el totalCollected principal que ve el usuario.
  const backendAmount = draw.totalCollected ?? 0;

  return {
    ...draw,
    totalCollected: localCredits, // SSOT: Usamos créditos del ledger
    premiumsPaid: localDebits,    // SSOT: Usamos débitos (premios) del ledger
    netResult: localNet,          // SSOT: Usamos neto del ledger
    _offline: {
      pendingCount: pendingCount,
      localAmount: localCredits,
      backendAmount: backendAmount,
      hasDiscrepancy: Math.abs(localCredits - backendAmount) > 0.01,
    },
  } as Draw;
}
