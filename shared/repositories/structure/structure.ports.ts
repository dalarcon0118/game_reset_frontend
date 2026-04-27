import { Agency, DashboardSummary } from './domain/models';
import { BackendListeroDetails } from './types/types';

export type ListeroDetails = BackendListeroDetails;

export interface IStructureRepository {
    getChildren: (id: number, level?: number) => Promise<Agency[]>;
    getSummary: (id: number, date?: string) => Promise<DashboardSummary>;
    getListeroDetails: (id: number, date?: string) => Promise<ListeroDetails>;
}

export type StructurePorts = IStructureRepository;
