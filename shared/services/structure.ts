import { StructureApi } from './structure/api';
import { BackendChildStructure, BackendListeroDetails } from './structure/types';

export type { BackendChildStructure as ChildStructure, BackendListeroDetails as ListeroDetails };

export class StructureService {
    /**
     * Get children nodes for a structure
     * @param id - ID of the structure
     * @param level - Level of children to fetch
     * @returns Promise with children structures
     */
    static async getChildren(id: number, level: number = 1): Promise<BackendChildStructure[]> {
        try {
            return await StructureApi.getChildren(id, level);
        } catch (error) {
            console.error('Error fetching children structures:', error);
            return [];
        }
    }

    /**
     * Get listero details for a structure
     * @param id - ID of the structure
     * @param date - Optional date filter
     * @returns Promise with listero details
     */
    static async getListeroDetails(id: number, date?: string): Promise<BackendListeroDetails> {
        try {
            return await StructureApi.getListeroDetails(id, date);
        } catch (error) {
            console.error(`Error fetching listero details for ID ${id}:`, error);
            throw error;
        }
    }
}
