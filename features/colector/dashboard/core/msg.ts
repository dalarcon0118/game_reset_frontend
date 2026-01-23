import { WebData } from '@/shared/core/remote.data';
import { ChildStructure } from '@/shared/services/Structure';

export type Msg =
    | { type: 'FETCH_CHILDREN_REQUESTED'; structureId?: string }
    | { type: 'CHILDREN_RECEIVED'; webData: WebData<ChildStructure[]> }
    | { type: 'REFRESH_CLICKED' }
    | { type: 'AUTH_USER_SYNCED'; user: any };

export const FETCH_CHILDREN_REQUESTED = (structureId?: string): Msg => ({ type: 'FETCH_CHILDREN_REQUESTED', structureId });
export const REFRESH_CLICKED = (): Msg => ({ type: 'REFRESH_CLICKED' });
export const AUTH_USER_SYNCED = (user: any): Msg => ({ type: 'AUTH_USER_SYNCED', user });