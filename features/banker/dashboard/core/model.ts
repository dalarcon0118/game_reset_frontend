import { WebData } from '@/shared/core/remote.data';
import { ChildStructure } from '@/shared/services/Structure';

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