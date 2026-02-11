import { IncidentApi } from './incident/api';
import { BackendIncident, IncidentCreateData } from './incident/types';

export type { BackendIncident as Incident, IncidentCreateData };

export class IncidentService {
    /**
     * Create a new incident report
     */
    static async create(data: IncidentCreateData): Promise<BackendIncident> {
        return await IncidentApi.create(data);
    }

    /**
     * List incidents reported by the current user
     */
    static async list(params?: { status?: string; ordering?: string; date?: string }): Promise<BackendIncident[]> {
        return await IncidentApi.list(params);
    }

    /**
     * Update an incident status
     */
    static async updateStatus(id: string | number, status: string, notes: string): Promise<BackendIncident> {
        return await IncidentApi.updateStatus(id, status, notes);
    }
}

export default IncidentService;
