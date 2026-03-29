import { WebData } from '@core/tea-utils';
import { ChildStructure } from '@/shared/services/structure';

export interface DashboardStats {
    total: number;
    pending: number;
    completed: number;
    netTotal: string;
    grossTotal: string;
    commissions: string;
    dailyProfit: string;
}

export interface Model {
    children: WebData<ChildStructure[]>;
    stats: WebData<DashboardStats>;
    currentDate: string;
    userStructureId: string | null;
    commissionRate: number;
    showBalance: boolean;
    user: any;
}