import { WebData } from '@/shared/core/remote.data';
import { ChildStructure } from '@/shared/services/structure';
import { DashboardStats } from './model';

export type Msg =
    | { type: 'FETCH_CHILDREN_REQUESTED'; structureId?: string }
    | { type: 'CHILDREN_RECEIVED'; webData: WebData<ChildStructure[]> }
    | { type: 'FETCH_STATS_REQUESTED'; structureId?: string }
    | { type: 'STATS_RECEIVED'; webData: WebData<{ date: string; stats: DashboardStats }> }
    | { type: 'REFRESH_CLICKED' }
    | { type: 'AUTH_USER_SYNCED'; user: any }
    | { type: 'TOGGLE_BALANCE' }
    | { type: 'NAVIGATE_TO_NOTIFICATIONS' }
    | { type: 'NAVIGATE_TO_DETAILS'; id: string; name: string }
    | { type: 'NAVIGATE_TO_RULES'; structureId: string }
    | { type: 'NAVIGATE_TO_SETTINGS' };

export const FETCH_CHILDREN_REQUESTED = (structureId?: string): Msg => ({ type: 'FETCH_CHILDREN_REQUESTED', structureId });
export const FETCH_STATS_REQUESTED = (structureId?: string): Msg => ({ type: 'FETCH_STATS_REQUESTED', structureId });
export const REFRESH_CLICKED = (): Msg => ({ type: 'REFRESH_CLICKED' });
export const AUTH_USER_SYNCED = (user: any): Msg => ({ type: 'AUTH_USER_SYNCED', user });
export const TOGGLE_BALANCE = (): Msg => ({ type: 'TOGGLE_BALANCE' });
export const NAVIGATE_TO_NOTIFICATIONS = (): Msg => ({ type: 'NAVIGATE_TO_NOTIFICATIONS' });
export const NAVIGATE_TO_DETAILS = (id: string, name: string): Msg => ({ type: 'NAVIGATE_TO_DETAILS', id, name });
export const NAVIGATE_TO_RULES = (structureId: string): Msg => ({ type: 'NAVIGATE_TO_RULES', structureId });
export const NAVIGATE_TO_SETTINGS = (): Msg => ({ type: 'NAVIGATE_TO_SETTINGS' });