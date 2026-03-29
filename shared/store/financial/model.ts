import { Cmd, WebData } from '@core/tea-utils';
import { NodeFinancialSummary, FinancialRepository } from '@/shared/repositories/financial';
import { FinancialSummary } from '@/types';
import { Any } from 'io-ts';

export interface Model {
    summaries: Record<number, WebData<NodeFinancialSummary>>;
    drawSummaries: Record<number, WebData<FinancialSummary>>;
    commissionRate: number;
}

export const initialModel: () => [Model, any] = () => ([{
    summaries: {},
    drawSummaries: {},
    commissionRate: 0.10, // Default 10%
}, Cmd.none]);
