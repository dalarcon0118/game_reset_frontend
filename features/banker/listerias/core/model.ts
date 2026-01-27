import { WebData } from '@/shared/core/remote.data';
import { ChildStructure } from '@/shared/services/Structure';

export interface Model {
    id: number | null;
    listerias: WebData<ChildStructure[]>;
}
