import { IntegrityStatus, DailyTotals, DiscrepancyReport } from './core/types';
import { PluginContext } from '@/shared/core/plugins/plugin.types';

export interface Model {
  context: PluginContext | null;
  localTotals: DailyTotals;
  backendTotals: DailyTotals;
  integrityStatus: IntegrityStatus;
  discrepancies: DiscrepancyReport[];
  commissionRate: number;
  lastSyncTimestamp: number;
}

export const initialModel = (params?: { context: PluginContext }): Model => ({
  context: params?.context ?? null,
  localTotals: {
    totalCollected: 0,
    premiumsPaid: 0,
    netResult: 0,
    estimatedCommission: 0,
    amountToRemit: 0,
  },
  backendTotals: {
    totalCollected: 0,
    premiumsPaid: 0,
    netResult: 0,
    estimatedCommission: 0,
    amountToRemit: 0,
  },
  integrityStatus: 'NOT_STARTED',
  discrepancies: [],
  commissionRate: 0.1,
  lastSyncTimestamp: 0,
});
