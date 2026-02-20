export type IntegrityStatus = 'MATCH' | 'MISMATCH' | 'SYNCING' | 'NOT_STARTED';

export interface DailyTotals {
  totalCollected: number;
  premiumsPaid: number;
  netResult: number;
  estimatedCommission: number;
  amountToRemit: number;
}

export interface DiscrepancyReport {
  timestamp: number;
  localValue: number;
  backendValue: number;
  delta: number;
  type: 'SALES' | 'PREMIUMS' | 'UNKNOWN';
}

export interface IntegrityState {
  status: IntegrityStatus;
  lastReconciliation?: number;
  discrepancies: DiscrepancyReport[];
}
