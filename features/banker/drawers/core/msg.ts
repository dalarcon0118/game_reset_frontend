import { WebData } from '@core/tea-utils';
import { ListeroDetails } from '@/shared/services/structure';

export type Msg =
    | { type: 'INIT_SCREEN'; id: number }
    | { type: 'SET_SELECTED_DATE'; date: Date }
    | { type: 'FETCH_DETAILS_REQUESTED' }
    | { type: 'DETAILS_RECEIVED'; webData: WebData<ListeroDetails> }
    | { type: 'REFRESH_CLICKED' }
    | { type: 'NAVIGATE_BACK' }
    | { type: 'REPORT_CLICKED'; drawId: number }
    | { type: 'CONFIRM_DRAW'; drawId: number }
    | { type: 'NAVIGATE_DATE'; days: number }
    | { type: 'SET_STATUS_FILTER'; status: string | null }
    | { type: 'SET_TYPE_FILTER'; drawType: string | null }
    | { type: 'CLEAR_FILTERS' };

