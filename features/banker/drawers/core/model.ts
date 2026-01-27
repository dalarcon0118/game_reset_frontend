import { WebData } from '@/shared/core/remote.data';
import { ListeroDetails } from '@/shared/services/Structure';

export interface Model {
    id: number | null;
    selectedDate: Date;
    details: WebData<ListeroDetails>;
}