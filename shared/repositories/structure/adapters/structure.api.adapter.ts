import { IStructureRepository, ListeroDetails } from '../structure.ports';
import { StructureApi } from '../api/api';
import { Agency } from '../domain/models';

export class StructureApiAdapter implements IStructureRepository {
    async getChildren(id: number, level: number = 1): Promise<Agency[]> {
        return await StructureApi.getChildren(id, level);
    }

    async getListeroDetails(id: number, date?: string): Promise<ListeroDetails> {
        return await StructureApi.getListeroDetails(id, date);
    }
}
