import { WebData } from '@core/tea-utils';
import { ListeroDetails } from '@/shared/services/structure';

export interface Model {
    id: number;
    selectedDate: Date;
    details: WebData<ListeroDetails>;
}