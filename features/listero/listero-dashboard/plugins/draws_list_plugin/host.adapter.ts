import * as t from 'io-ts';
import * as E from 'fp-ts/Either';
import { PathReporter } from 'io-ts/PathReporter';
import { RemoteData, WebData } from '@core/tea-utils';
import { logger } from '@/shared/utils/logger';
import { DRAW_FILTER, DrawCodec, Draw } from './core/types';
import { FinancialSummary } from '@/types';
import { DrawsListPluginConfig } from './model';

const log = logger.withTag('DRAWS_LIST_PLUGIN_ADAPTER');

export interface HostStatePayload {
  draws: WebData<Draw[]>;
  filter: string;
  summary: FinancialSummary | null;
  commissionRate: number;
  userStructureId: string | null;
}

/**
 * Creates a simple hash of draws data for comparison to avoid unnecessary updates
 */
export function createDrawsHash(draws: WebData<Draw[]>, filter: string, summary: FinancialSummary | null): string {
  if (!RemoteData.isSuccess(draws)) {
    return `${draws.type}-${filter}`;
  }

  // Hash based on Draw IDs and status to detect real changes
  const ids = RemoteData.isSuccess(draws)
    ? (draws as any).data.map((d: any) => `${d.id}-${d.status}`).join(',')
    : '';
  const summaryPart = summary ? '-with-summary' : '';

  return `${ids}-${filter}${summaryPart}`;
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
  const commissionRate = hostModel.commissionRate || 0;
  const userStructureId = hostModel.userStructureId || null;

  // Las apuestas (pendingBets y syncedBets) se omiten ya que se sincronizarán manualmente

  // DEBUG: Log raw draws data to validate financial fields (only if needed)
  if (RemoteData.isSuccess(rawDraws) && (rawDraws as any).data && (rawDraws as any).data.length > 0) {
    const firstDraw = (rawDraws as any).data[0];
    // Optional: Keep this debug log if it's still critical, otherwise we can remove it or lower level
    log.debug('RAW_DRAWS_DEBUG', { id: firstDraw.id, keys: Object.keys(firstDraw) });
  }

  // Validate draws data using io-ts
  let validatedDraws: WebData<Draw[]> = rawDraws;

  // DEBUG: Trace raw state type
  if (rawDraws?.type !== 'Success') {
    log.debug('Host raw draws state is not Success', { type: rawDraws?.type });
  }

  if (RemoteData.isSuccess(rawDraws)) {
    const result = t.array(DrawCodec).decode(rawDraws.data);

    if (E.isRight(result)) {
      validatedDraws = RemoteData.success(result.right);
      log.info('DRAWS_VALIDATION_SUCCESS', { count: result.right.length });

      // DEBUG: Log validated draws (optional, kept for parity with original)
      if (result.right.length > 0) {
        const validatedFirst = result.right[0];
        log.debug('VALIDATED_DRAWS_DEBUG', { id: validatedFirst.id, keys: Object.keys(validatedFirst) });
      }
    } else {
      const errorMsg = PathReporter.report(result).join(' | ');
      log.error('DRAWS_VALIDATION_FAILED - Converting to Failure state!', {
        error: errorMsg,
        rawDataKeys: rawDraws.data ? Object.keys(rawDraws.data[0] || {}) : 'no data'
      });
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
    commissionRate,
    userStructureId
  };
}
