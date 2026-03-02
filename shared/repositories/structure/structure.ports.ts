import { BackendChildStructure, BackendListeroDetails } from './types/types';

export type ChildStructure = BackendChildStructure;
export type ListeroDetails = BackendListeroDetails;

export interface IStructureRepository {
    getChildren(id: number, level?: number): Promise<ChildStructure[]>;
    getListeroDetails(id: number, date?: string): Promise<ListeroDetails>;
}
