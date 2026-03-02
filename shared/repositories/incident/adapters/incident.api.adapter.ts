import { IIncidentRepository, Incident, CreateIncidentData } from '../incident.ports';
import { IncidentApi } from '../api/api';

export class IncidentApiAdapter implements IIncidentRepository {
    async create(data: CreateIncidentData): Promise<Incident> {
        return await IncidentApi.create(data);
    }

    async list(params?: { status?: string; ordering?: string; date?: string }): Promise<Incident[]> {
        return await IncidentApi.list(params);
    }

    async updateStatus(id: string | number, status: string, notes: string): Promise<Incident> {
        return await IncidentApi.updateStatus(id, status, notes);
    }
}
