import apiClient from '@/shared/services/api_client';
import settings from '@/config/settings';

export interface IncidentCreateData {
    structure: number;
    draw?: number | null;
    incident_type: string;
    description: string;
}

export interface Incident extends IncidentCreateData {
    id: number;
    reporter: number;
    reporter_name: string;
    structure_name: string;
    draw_name?: string | null;
    status: 'pending' | 'in_review' | 'resolved' | 'cancelled';
    created_at: string;
    updated_at: string;
}

export class IncidentService {
    /**
     * Create a new incident report
     */
    static async create(data: IncidentCreateData): Promise<Incident> {
        return await apiClient.post<Incident>(settings.api.endpoints.incidents(), data);
    }

    /**
     * List incidents reported by the current user
     */
    static async list(params?: { status?: string; ordering?: string; date?: string }): Promise<Incident[]> {
        const queryParams = new URLSearchParams();
        
        // Only append parameters that have a valid value
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, value);
                }
            });
        }

        const queryString = queryParams.toString();
        const baseUrl = settings.api.endpoints.incidents();
        const url = queryString ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${queryString}` : baseUrl;
        
        return await apiClient.get<Incident[]>(url);
    }

    /**
     * Update an incident status
     */
    static async updateStatus(id: string | number, status: string, notes: string): Promise<Incident> {
        return await apiClient.patch<Incident>(`${settings.api.endpoints.incidents()}${id}/`, {
            status: status,
            notes: notes
        });
    }
}

export default IncidentService;
