import { WebData } from '@core/tea-utils';
import { ChildStructure } from '@/shared/services/structure';

export interface DashboardSummary {
    totalCollected: number;
    netProfit: number;
    commissionsPaid: number;
    bankReserves: number;
}

export interface Model {
    agencies: WebData<ChildStructure[]>;
    summary: WebData<DashboardSummary>;
    userStructureId: string | null;
    selectedAgencyId: number | null;
}