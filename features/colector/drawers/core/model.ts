import { WebData } from '@/shared/core/remote.data';
import { ListeroDetails } from '@/shared/services/structure';

export interface Model {
    id: number;
    selectedDate: Date;
    details: WebData<ListeroDetails>;
}