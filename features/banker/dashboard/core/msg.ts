import { WebData } from '@/shared/core/remote.data';
import { ChildStructure } from '@/shared/services/Structure';
import { DashboardSummary } from './model';

export type Msg =
    | { type: 'FETCH_DATA_REQUESTED'; structureId: string }
    | { type: 'DATA_RECEIVED'; webData: WebData<{ children: ChildStructure[], summary: DashboardSummary }> }
    | { type: 'REFRESH_CLICKED' }
    | { type: 'AGENCY_SELECTED'; agencyId: number }
    | { type: 'RULES_PRESSED'; agencyId: number }
    | { type: 'LIST_PRESSED'; agencyId: number }
    | { type: 'AUTH_USER_SYNCED'; user: any }
    | { type: 'NAVIGATE_TO_SETTINGS' }
    | { type: 'NAVIGATE_TO_NOTIFICATIONS' };

export const NAVIGATE_TO_SETTINGS = (): Msg => ({ type: 'NAVIGATE_TO_SETTINGS' });
export const NAVIGATE_TO_NOTIFICATIONS = (): Msg => ({ type: 'NAVIGATE_TO_NOTIFICATIONS' });