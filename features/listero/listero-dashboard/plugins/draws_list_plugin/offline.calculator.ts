import { BetDomainModel as PendingBet } from '@/shared/repositories/bet/bet.types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('OfflineCalculator');

export interface OfflineDrawUpdate {
  drawId: string;
  localTotalCollected: number;
  localNetResult: number;
  pendingCount: number;
}

/**
 * Calculates offline financial statistics based on pending bets.
 * This is a pure function that aggregates data.
 */
export function calculateOfflineUpdates(pendingBets: PendingBet[]): OfflineDrawUpdate[] {
  const drawMap = new Map<string, { localTotalCollected: number; localNetResult: number; pendingCount: number }>();

  if (pendingBets.length > 0) {
    pendingBets.forEach(bet => {
      // Handle both new flat structure and legacy nested structure
      const drawIdRaw = bet.drawId ?? (bet as any).data?.draw;
      if (!drawIdRaw) return;

      const drawId = String(drawIdRaw);
      const current = drawMap.get(drawId) || { localTotalCollected: 0, localNetResult: 0, pendingCount: 0 };

      // Calculate amounts safely from both structures
      const amount = Number(bet.amount ?? (bet as any).data?.amount) || 0;
      const totalCollected = (bet as any).financialImpact?.totalCollected || amount;

      const netAmount = (bet as any).financialImpact?.netAmount;
      const hasNetAmount = netAmount !== undefined;

      let effectiveNetAmount: number;
      if (hasNetAmount) {
        effectiveNetAmount = netAmount;
      } else {
        log.warn('[OfflineCalculator] Missing financialImpact.netAmount, using fallback (amount as net - WARNING: commission not deducted)', {
          betId: bet.id,
          drawId,
          amount
        });
        effectiveNetAmount = amount;
      }

      drawMap.set(drawId, {
        localTotalCollected: current.localTotalCollected + totalCollected,
        localNetResult: current.localNetResult + effectiveNetAmount,
        pendingCount: current.pendingCount + 1,
      });
    });
  }

  return Array.from(drawMap.entries()).map(([drawId, data]) => ({
    drawId,
    localTotalCollected: data.localTotalCollected,
    localNetResult: data.localNetResult,
    pendingCount: data.pendingCount,
  }));
}
