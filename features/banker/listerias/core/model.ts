import { WebData } from '@core/tea-utils';
import { ChildStructure } from '@/shared/services/structure';

export interface Model {
    id: number | null;
    listerias: WebData<ChildStructure[]>;
}
