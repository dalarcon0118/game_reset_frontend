import { Incident, IncidentCreateData } from './api/types/types';

export type CreateIncidentData = IncidentCreateData;

export interface IIncidentRepository {
    create(data: CreateIncidentData): Promise<Incident>;
    list(params?: { status?: string; ordering?: string; date?: string }): Promise<Incident[]>;
    updateStatus(id: string | number, status: string, notes: string): Promise<Incident>;
}
