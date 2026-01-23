import { WebData } from '@/shared/core/remote.data';
import { ChildStructure } from '@/shared/services/Structure';

export interface Model {
    children: WebData<ChildStructure[]>;
    userStructureId: string | null;
}