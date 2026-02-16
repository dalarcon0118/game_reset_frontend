import { createMsg } from '@/shared/core/msg';
import { PluginContext } from '@/shared/core/plugins/plugin.types';
import { PendingBet } from '@/shared/services/offline_storage';
import { FinancialSummary } from '@/types';

export const INIT_CONTEXT = createMsg<'INIT_CONTEXT', PluginContext>('INIT_CONTEXT');

export const SYNC_DATA = createMsg<'SYNC_DATA', {
  allLocalBets: PendingBet[];
  backendSummary: FinancialSummary | null;
  commissionRate: number;
}>('SYNC_DATA');

export const PERFORM_RECONCILIATION = createMsg<'PERFORM_RECONCILIATION', void>('PERFORM_RECONCILIATION');

export const REPORT_DISCREPANCY = createMsg<'REPORT_DISCREPANCY', {
  localValue: number;
  backendValue: number;
  delta: number;
}>('REPORT_DISCREPANCY');

export const NOOP = createMsg<'NOOP', void>('NOOP');
