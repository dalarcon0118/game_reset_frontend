import { PendingBet } from '@/shared/services/offline_storage';

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
      // Handle different property names for draw ID
      const drawIdRaw = bet.drawId || bet.draw;
      if (!drawIdRaw) return;

      const drawId = String(drawIdRaw);
      const current = drawMap.get(drawId) || { localTotalCollected: 0, localNetResult: 0, pendingCount: 0 };
      
      // Calculate amounts
      const amount = bet.financialImpact?.totalCollected || bet.amount || 0;
      const netAmount = bet.financialImpact?.netAmount || (amount * 0.9); // Default 10% commission if missing

      drawMap.set(drawId, {
        localTotalCollected: current.localTotalCollected + amount,
        localNetResult: current.localNetResult + netAmount,
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
