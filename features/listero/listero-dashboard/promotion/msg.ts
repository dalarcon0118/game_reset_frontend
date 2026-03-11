import { WebData } from '@/shared/core/tea-utils';
import { Promotion } from './model';

export type Msg =
    | { type: 'FETCH_PROMOTIONS_REQUESTED' }
    | { type: 'PROMOTIONS_RECEIVED'; webData: WebData<Promotion[]> }
    | { type: 'CLOSE_PROMOTIONS_MODAL' };

export const FETCH_PROMOTIONS_REQUESTED = (): Msg => ({ type: 'FETCH_PROMOTIONS_REQUESTED' });
export const PROMOTIONS_RECEIVED = (webData: WebData<Promotion[]>): Msg => ({ type: 'PROMOTIONS_RECEIVED', webData });
export const CLOSE_PROMOTIONS_MODAL = (): Msg => ({ type: 'CLOSE_PROMOTIONS_MODAL' });
