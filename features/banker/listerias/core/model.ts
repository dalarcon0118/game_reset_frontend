import { WebData } from '@/shared/core/remote.data';
import { ChildStructure } from '@/shared/services/structure';

export interface Model {
    id: number | null;
    listerias: WebData<ChildStructure[]>;
}
