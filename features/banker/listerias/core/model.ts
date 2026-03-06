import { WebData } from '@/shared/core/tea-utils/remote.data';
import { ChildStructure } from '@/shared/services/structure';

export interface Model {
    id: number | null;
    listerias: WebData<ChildStructure[]>;
}
