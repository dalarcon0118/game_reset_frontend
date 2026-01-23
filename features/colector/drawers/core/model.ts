import { WebData } from '@/shared/core/remote.data';
import { ListeroDetails } from '@/shared/services/Structure';

export interface Model {
    id: number;
    selectedDate: Date;
    details: WebData<ListeroDetails>;
}