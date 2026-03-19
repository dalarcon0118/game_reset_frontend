import { WebData } from '@core/tea-utils';
import { Promotion } from './model';
import { DrawType } from '@/types';

export type Msg =
    | { type: 'FETCH_PROMOTIONS_REQUESTED' }
    | { type: 'PROMOTIONS_RECEIVED'; webData: WebData<Promotion[]> }
    | { type: 'CLOSE_PROMOTIONS_MODAL' }
    | { type: 'PARTICIPATE_CLICKED'; payload: Promotion; activeDraws?: DrawType[] }
    | { type: 'MARK_PROMOTIONS_SHOWN' };

export const FETCH_PROMOTIONS_REQUESTED = (): Msg => ({ type: 'FETCH_PROMOTIONS_REQUESTED' });
export const PROMOTIONS_RECEIVED = (webData: WebData<Promotion[]>): Msg => ({ type: 'PROMOTIONS_RECEIVED', webData });
export const CLOSE_PROMOTIONS_MODAL = (): Msg => ({ type: 'CLOSE_PROMOTIONS_MODAL' });
export const PARTICIPATE_CLICKED = (promotion: Promotion, activeDraws?: DrawType[]): Msg => ({
    type: 'PARTICIPATE_CLICKED',
    payload: promotion,
    activeDraws
});
export const MARK_PROMOTIONS_SHOWN = (): Msg => ({ type: 'MARK_PROMOTIONS_SHOWN' });
