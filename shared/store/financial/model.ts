import { WebData } from '@/shared/core/remote.data';
import { NodeFinancialSummary, FinancialSummaryService } from '@/shared/services/financial_summary';
import { FinancialSummary } from '@/types';

export interface Model {
    summaries: Record<number, WebData<NodeFinancialSummary>>;
    drawSummaries: Record<number, WebData<FinancialSummary>>;
}

export const initialModel: Model = {
    summaries: {},
    drawSummaries: {},
};
