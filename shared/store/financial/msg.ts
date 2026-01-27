import { WebData } from '@/shared/core/remote.data';
import { NodeFinancialSummary } from '@/shared/services/financial_summary';
import { FinancialSummary } from '@/types';

export type Msg =
    | { type: 'FETCH_SUMMARY_REQUESTED'; nodeId: number }
    | { type: 'SUMMARY_RECEIVED'; nodeId: number; webData: WebData<NodeFinancialSummary> }
    | { type: 'SYNC_NODES'; nodeIds: number[] }
    | { type: 'FETCH_DRAW_SUMMARY_REQUESTED'; drawId: number }
    | { type: 'DRAW_SUMMARY_RECEIVED'; drawId: number; webData: WebData<FinancialSummary> }
    | { type: 'SYNC_DRAWS'; drawIds: number[] };
