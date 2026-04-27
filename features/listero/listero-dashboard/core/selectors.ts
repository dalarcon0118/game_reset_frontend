import { DrawType } from '@/types';
import { DailyTotals } from '@/shared/domain/financial.types';
import { calculateFinancialProjection, extractDailyTotals } from '@/shared/domain/financial.projection';
import { Model } from './model';
import { TimerRepository } from '@/shared/repositories/system/time/tea.repository';
import { TimePolicy } from '@/shared/repositories/system/time/time.update';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('DASHBOARD_SELECTORS');
const EMPTY_TOTALS: DailyTotals = {
  totalCollected: 0,
  premiumsPaid: 0,
  netResult: 0,
  estimatedCommission: 0,
  amountToRemit: 0,
  betCount: 0,
};

export const selectDailyTotals = (model: Model): DailyTotals => {
  const drawsData: DrawType[] = model.draws.type === 'Success' ? model.draws.data : [];

  if (drawsData.length === 0 && model.pendingBets.length === 0 && model.syncedBets.length === 0) {
    log.debug('[FINANCIAL_FLOW] No draws or bets, returning empty totals');
    return EMPTY_TOTALS;
  }

  // Calcular rango de "hoy" basado en tiempo confiable del servidor, en zona local
  const trustedNow = TimerRepository.getTrustedNow(Date.now());
  const trustedDate = new Date(trustedNow);
  const todayStart = new Date(
    trustedDate.getFullYear(),
    trustedDate.getMonth(),
    trustedDate.getDate()
  ).getTime();
  const todayEnd = todayStart + 86400000; // 24h

  log.info('[FINANCIAL_FLOW] Calculating daily totals', {
    trustedNow,
    trustedNowLocal: new Date(trustedNow).toLocaleString(),
    todayStart,
    todayStartLocal: new Date(todayStart).toLocaleString(),
    todayEnd,
    todayEndLocal: new Date(todayEnd).toLocaleString(),
    todayStartSource: 'TimePolicy.getTodayStart()',
    pendingBetsCount: model.pendingBets.length,
    syncedBetsCount: model.syncedBets.length,
    drawsCount: drawsData.length
  });

  // Filtrar solo apuestas dentro del día de hoy
  const filterToday = (bets: typeof model.pendingBets, label: string) => {
    const filtered = bets.filter(b => {
      const ts = Number(b.timestamp) || 0;
      const inRange = ts >= todayStart && ts < todayEnd;
      if (!inRange && ts > 0) {
        log.debug(`[FINANCIAL_FLOW] ${label} bet excluded (outside today)`, {
          betId: b.id || b.externalId,
          timestamp: ts,
          timestampLocal: new Date(ts).toLocaleString(),
          amount: b.amount,
          status: b.status
        });
      }
      return inRange;
    });
    log.info(`[FINANCIAL_FLOW] ${label} filtered: ${bets.length} -> ${filtered.length} (today only)`);
    if (filtered.length > 0 && filtered.length <= 5) {
      log.info(`[FINANCIAL_FLOW] Sample ${label} bets:`, filtered.map(b => ({
        id: b.id || b.externalId,
        timestamp: b.timestamp,
        timestampLocal: new Date(b.timestamp).toLocaleString(),
        amount: b.amount,
        status: b.status
      })));
    }
    return filtered;
  };

  const premiumsByDraw: Record<string, number> = {};
  for (const draw of drawsData) {
    premiumsByDraw[draw.id] = (draw as any).premiumsPaid || 0;
  }

  const pendingToday = filterToday(model.pendingBets, 'pendingBets');
  const syncedToday = filterToday(model.syncedBets, 'syncedBets');

  log.info('[FINANCIAL_FLOW] Calling calculateFinancialProjection', {
    pendingTodayCount: pendingToday.length,
    syncedTodayCount: syncedToday.length,
    premiumsByDraw,
    commissionRate: model.commissionRate,
    structureId: model.userStructureId
  });

  const projection = calculateFinancialProjection(
    pendingToday,
    syncedToday,
    premiumsByDraw,
    model.commissionRate,
    model.userStructureId || ''
  );

  log.info('[FINANCIAL_FLOW] Projection result:', {
    totalCollected: projection.totalCollected,
    premiumsPaid: projection.premiumsPaid,
    estimatedCommission: projection.estimatedCommission,
    netResult: projection.netResult,
    betCount: projection.betCount,
    byDrawIdCount: Object.keys(projection.byDrawId).length,
    byBetTypeCount: Object.keys(projection.byBetType).length
  });

  const totals = extractDailyTotals(projection, model.commissionRate);

  log.info('[FINANCIAL_FLOW] Final DailyTotals:', totals);

  return totals;
};
