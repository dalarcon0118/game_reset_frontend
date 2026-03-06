import { WebData } from '@/shared/core/tea-utils/remote.data';
import { ListeroDetails } from '@/shared/services/structure';

export interface Model {
    id: number;
    selectedDate: Date;
    details: WebData<ListeroDetails>;
}