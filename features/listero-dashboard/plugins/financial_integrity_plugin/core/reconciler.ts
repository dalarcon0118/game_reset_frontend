import { PendingBet } from '@/shared/services/offline_storage';
import { DailyTotals, IntegrityStatus, DiscrepancyReport } from './types';
import { calculatePayloadAmount } from '@/features/listero-dashboard/core/logic';

/**
 * Calcula los totales basados exclusivamente en las apuestas almacenadas localmente.
 * Incluye tanto las pendientes como las ya sincronizadas del día.
 */
export const calculateLocalTotals = (
  allLocalBets: PendingBet[],
  commissionRate: number
): DailyTotals => {
  return allLocalBets.reduce(
    (acc, bet) => {
      const amount = calculatePayloadAmount(bet);
      const commission = amount * commissionRate;
      
      return {
        totalCollected: acc.totalCollected + amount,
        premiumsPaid: acc.premiumsPaid, // El local no suele conocer los premios hasta el sync
        netResult: acc.netResult + amount,
        estimatedCommission: acc.estimatedCommission + commission,
        amountToRemit: acc.amountToRemit + (amount - commission),
      };
    },
    {
      totalCollected: 0,
      premiumsPaid: 0,
      netResult: 0,
      estimatedCommission: 0,
      amountToRemit: 0,
    }
  );
};

/**
 * Motor de reconciliación que compara la verdad local contra la del servidor.
 */
export const reconcile = (
  localTotals: DailyTotals,
  backendTotals: DailyTotals,
  tolerance: number = 0.01
): { status: IntegrityStatus; discrepancy?: DiscrepancyReport } => {
  const delta = localTotals.totalCollected - backendTotals.totalCollected;

  if (Math.abs(delta) <= tolerance) {
    return { status: 'MATCH' };
  }

  return {
    status: 'MISMATCH',
    discrepancy: {
      timestamp: Date.now(),
      localValue: localTotals.totalCollected,
      backendValue: backendTotals.totalCollected,
      delta: delta,
      type: 'SALES',
    },
  };
};
