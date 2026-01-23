import { WebData } from '@/shared/core/remote.data';
import { ListeroDetails } from '@/shared/services/Structure';

export type Msg =
    | { type: 'SET_SELECTED_DATE'; date: Date }
    | { type: 'FETCH_DETAILS_REQUESTED' }
    | { type: 'DETAILS_RECEIVED'; webData: WebData<ListeroDetails> }
    | { type: 'REFRESH_CLICKED' }
    | { type: 'NAVIGATE_BACK' }
    | { type: 'REPORT_CLICKED'; drawId: number }
    | { type: 'CONFIRM_DRAW'; drawId: number }
    | { type: 'NAVIGATE_DATE'; days: number };

export const SET_SELECTED_DATE = (date: Date): Msg => ({ type: 'SET_SELECTED_DATE', date });
export const FETCH_DETAILS_REQUESTED = (): Msg => ({ type: 'FETCH_DETAILS_REQUESTED' });
export const REFRESH_CLICKED = (): Msg => ({ type: 'REFRESH_CLICKED' });
export const NAVIGATE_BACK = (): Msg => ({ type: 'NAVIGATE_BACK' });
export const REPORT_CLICKED = (drawId: number): Msg => ({ type: 'REPORT_CLICKED', drawId });
export const CONFIRM_DRAW = (drawId: number): Msg => ({ type: 'CONFIRM_DRAW', drawId });
export const NAVIGATE_DATE = (days: number): Msg => ({ type: 'NAVIGATE_DATE', days });