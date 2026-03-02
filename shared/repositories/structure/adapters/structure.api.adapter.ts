import { IStructureRepository, ChildStructure, ListeroDetails } from '../structure.ports';
import { StructureApi } from '../api/api';

export class StructureApiAdapter implements IStructureRepository {
    async getChildren(id: number, level: number = 1): Promise<ChildStructure[]> {
        return await StructureApi.getChildren(id, level);
    }

    async getListeroDetails(id: number, date?: string): Promise<ListeroDetails> {
        return await StructureApi.getListeroDetails(id, date);
    }
}
