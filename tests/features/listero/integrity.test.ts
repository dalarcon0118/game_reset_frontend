import { calculateLocalTotals, reconcile } from '@/features/listero/listero-dashboard/plugins/financial_integrity_plugin/core/reconciler';
import { BetDomainModel as PendingBet } from '@/shared/repositories/bet';

describe('Financial Integrity Plugin Logic', () => {
  const commissionRate = 0.1;

  const mockBets: PendingBet[] = [
    { offlineId: '1', amount: 100, timestamp: Date.now(), status: 'synced' } as any,
    { offlineId: '2', amount: 200, timestamp: Date.now(), status: 'pending' } as any,
  ];

  it('should calculate local totals correctly including synced and pending bets', () => {
    const totals = calculateLocalTotals(mockBets, commissionRate);
    expect(totals.totalCollected).toBe(300);
    expect(totals.estimatedCommission).toBe(30);
    expect(totals.amountToRemit).toBe(270);
  });

  it('should return MATCH status when local and backend totals match', () => {
    const localTotals = calculateLocalTotals(mockBets, commissionRate);
    const backendTotals = {
      totalCollected: 300,
      premiumsPaid: 0,
      netResult: 300,
      estimatedCommission: 30,
      amountToRemit: 270
    };

    const result = reconcile(localTotals, backendTotals);
    expect(result.status).toBe('MATCH');
  });

  it('should return MISMATCH status and report discrepancy when values differ', () => {
    const localTotals = calculateLocalTotals(mockBets, commissionRate); // 300
    const backendTotals = {
      totalCollected: 250, // Discrepancia de 50
      premiumsPaid: 0,
      netResult: 250,
      estimatedCommission: 25,
      amountToRemit: 225
    };

    const result = reconcile(localTotals, backendTotals);
    expect(result.status).toBe('MISMATCH');
    expect(result.discrepancy?.delta).toBe(50);
  });
});
