import apiClient from '@/shared/services/ApiClient';
import settings from '@/config/settings';

export interface ChildStructure {
    id: number;
    structure_id: number;
    name: string;
    type: string;
    total_collected: number;
    net_collected: number;
    premiums_paid: number;
    commissions: number;
    draw_name: string;
    draw_ids: number[];
}

export interface ListeroDrawDetail {
    draw_id: number;
    draw_name: string;
    status: string;
    winning_number: string | null;
    opening_time: string;
    closing_time: string;
    total_collected: number;
    total_paid: number;
    net_result: number;
    commissions: number;
    status_closed?: 'success' | 'reported' | null;
}

export interface ListeroDetails {
    listero_name: string;
    draws: ListeroDrawDetail[];
}

export class StructureService {
    /**
     * Get children nodes for a structure
     * @param id - ID of the structure
     * @param level - Level of children to fetch
     * @returns Promise with children structures
     */
    static async getChildren(id: number, level: number = 1): Promise<ChildStructure[]> {
        try {
            const params = new URLSearchParams();
            params.append('level', level.toString());
            params.append('active', 'true');
            params.append('draw', 'true');
            params.append('today', 'true');

            const endpoint = `${settings.api.endpoints.structures}${id}/children/?${params.toString()}`;
            return await apiClient.get<ChildStructure[]>(endpoint);
        } catch (error) {
            console.error('Error fetching children structures:', error);
            return [];
        }
    }

    static async getListeroDetails(id: number, date?: string): Promise<ListeroDetails> {
        try {
            let endpoint = `${settings.api.endpoints.structures}${id}/listero_details/`;
            if (date) {
                endpoint += `?date=${date}`;
            }
            const response = await apiClient.get<ListeroDetails>(endpoint);
            return response;
        } catch (error) {
            console.error(`Error fetching listero details for ID ${id}:`, error);
            throw error;
        }
    }
}
