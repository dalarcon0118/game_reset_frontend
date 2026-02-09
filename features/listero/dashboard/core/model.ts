import { WebData } from '@/shared/core/remote.data';
import { FinancialSummary, DrawType } from '@/types';
import { PendingBet } from '@/shared/services/offline_storage';
import { StatusFilter, DailyTotals } from './core.types';

export interface Model {
    draws: WebData<DrawType[]>;
    filteredDraws: DrawType[];
    summary: WebData<FinancialSummary>;
    pendingBets: PendingBet[];
    dailyTotals: DailyTotals;
    userStructureId: string | null;
    statusFilter: StatusFilter;
    appliedFilter: StatusFilter;
    commissionRate: number;
    showBalance: boolean;
    authToken: string | null;
    currentUser: any | null;
    isRateLimited: boolean;
}
