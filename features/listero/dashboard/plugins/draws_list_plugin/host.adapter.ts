import * as t from 'io-ts';
import * as E from 'fp-ts/Either';
import { PathReporter } from 'io-ts/PathReporter';
import { RemoteData, WebData } from '@/shared/core/remote.data';
import { logger } from '@/shared/utils/logger';
import { DRAW_FILTER, DrawCodec, Draw } from './core/types';
import { FinancialSummary } from '@/types';
import { PendingBet } from '@/shared/services/offline_storage';
import { DrawsListPluginConfig } from './model';

const log = logger.withTag('DRAWS_LIST_PLUGIN_ADAPTER');

export interface HostStatePayload {
  draws: WebData<Draw[]>;
  filter: string;
  summary: FinancialSummary | null;
  pendingBets: PendingBet[];
  syncedBets: PendingBet[];
}

/**
 * Creates a simple hash of draws data for comparison to avoid unnecessary updates
 */
export function createDrawsHash(draws: WebData<Draw[]>, filter: string, summary: FinancialSummary | null, pendingBetsLength: number, syncedBetsLength: number): string {
  if (!RemoteData.isSuccess(draws)) {
    return `${draws.type}-${filter}`;
  }

  // Hash based on Draw IDs and status to detect real changes
  const ids = draws.data.map((d) => `${d.id}-${d.status}`).join(',') || '';
  const summaryPart = summary ? '-with-summary' : '';

  return `${ids}-${filter}${summaryPart}-${pendingBetsLength}-${syncedBetsLength}`;
}

/**
 * Extracts and validates the plugin state from the host store
 */
export function extractHostState(state: any, config: DrawsListPluginConfig): HostStatePayload {
  // Try to get the host model from common locations
  const hostModel = state.model || state;
  const rawDraws = hostModel[config.drawsStateKey];
  const filter = hostModel.statusFilter || DRAW_FILTER.ALL;
  const summary = hostModel.summary || null;
  const pendingBets = hostModel.pendingBets || [];
  const syncedBets = hostModel.syncedBets || [];

  // DEBUG: Log raw draws data to validate financial fields (only if needed)
  if (RemoteData.isSuccess(rawDraws) && rawDraws.data && rawDraws.data.length > 0) {
    const firstDraw = rawDraws.data[0];
    // Optional: Keep this debug log if it's still critical, otherwise we can remove it or lower level
    // log.debug('RAW_DRAWS_DEBUG', { id: firstDraw.id, ... }); 
  }

  // Validate draws data using io-ts
  let validatedDraws: WebData<Draw[]> = rawDraws;

  if (RemoteData.isSuccess(rawDraws)) {
    const result = t.array(DrawCodec).decode(rawDraws.data);

    if (E.isRight(result)) {
      validatedDraws = RemoteData.success(result.right);

      // DEBUG: Log validated draws (optional, kept for parity with original)
      if (result.right.length > 0) {
        const validatedFirst = result.right[0];
        // log.debug('VALIDATED_DRAWS_DEBUG', { id: validatedFirst.id, ... });
      }
    } else {
      const errorMsg = PathReporter.report(result).join(' | ');
      log.warn('DRAWS_VALIDATION_FAILED', errorMsg);
      // STRICT SAFETY: If validation fails, we return a Failure state instead of passing raw data.
      // This ensures downstream components only receive valid Draw objects.
      validatedDraws = RemoteData.failure({
        code: 'VALIDATION_ERROR',
        message: 'Invalid data structure received from host',
        details: errorMsg
      });
    }
  }

  return {
    draws: validatedDraws,
    filter,
    summary,
    pendingBets,
    syncedBets
  };
}
