import { WebData } from '@core/tea-utils';
import { Agency } from '@/shared/repositories/structure/domain/models';

export interface Model {
    id: number | null;
    listerias: WebData<Agency[]>;
}
