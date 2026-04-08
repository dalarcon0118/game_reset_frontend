import { StructurePorts, ListeroDetails } from '../structure.ports';
import { StructureApi } from '../api/api';
import { Agency, DashboardSummary } from '../domain/models';
import { StructureMapper } from '../mappers/mappers';

export class StructureApiAdapter implements StructurePorts {
    async getChildren(id: number, level: number = 1): Promise<Agency[]> {
        return await StructureApi.getChildren(id, level);
    }

    async getSummary(id: number, date?: string): Promise<DashboardSummary> {
        return await StructureApi.getSummary(id, date);
    }

    async getListeroDetails(id: number, date?: string): Promise<ListeroDetails> {
        const backendDetails = await StructureApi.getListeroDetails(id, date);
        return {
            listero_name: backendDetails.listero_name,
            draws: StructureMapper.toListeroDrawDetails(backendDetails.draws)
        };
    }
}
