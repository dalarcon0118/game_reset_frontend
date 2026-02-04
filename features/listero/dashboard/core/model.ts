import { WebData } from '@/shared/core/remote.data';
import { FinancialSummary, DrawType } from '@/types';
import { StatusFilter, DailyTotals } from './core.types';

export interface Model {
    draws: WebData<DrawType[]>;
    filteredDraws: DrawType[];
    summary: WebData<FinancialSummary>;
    dailyTotals: DailyTotals;
    userStructureId: string | null;
    statusFilter: StatusFilter;
    appliedFilter: StatusFilter;
    commissionRate: number;
    showBalance: boolean;
    authToken: string | null;
    currentUser: any | null;
}
