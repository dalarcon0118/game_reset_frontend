import { WebData } from '@/shared/core/tea-utils';
import { FinancialSummary, DrawType, BetType } from '@/types';
import { StatusFilter, DailyTotals } from './core.types';
import { DashboardUser } from './user.dto';

export interface Model {
    draws: WebData<DrawType[]>;
    filteredDraws: DrawType[];
    summary: WebData<FinancialSummary>;
    pendingBets: BetType[];
    syncedBets: BetType[]; // Todas las apuestas sincronizadas del día
    dailyTotals: DailyTotals;
    userStructureId: string | null;
    statusFilter: StatusFilter;
    appliedFilter: StatusFilter;
    commissionRate: number;
    showBalance: boolean;
    authToken: string | null;
    currentUser: DashboardUser | null;
    isRateLimited: boolean;
}
