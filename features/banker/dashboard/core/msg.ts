import { WebData } from '@core/tea-utils';
import { Agency, DashboardSummary } from '@/shared/repositories/structure/domain/models';
import { User } from '@/shared/repositories/auth/types/types';

export type Msg =
    | { type: 'FETCH_DATA_REQUESTED'; structureId: string }
    | { type: 'AGENCIES_RECEIVED'; webData: WebData<Agency[]> }
    | { type: 'SUMMARY_RECEIVED'; webData: WebData<DashboardSummary> }
    | { type: 'REFRESH_CLICKED' }
    | { type: 'AGENCY_SELECTED'; agencyId: number }
    | { type: 'RULES_PRESSED'; agencyId: number }
    | { type: 'LIST_PRESSED'; agencyId: number }
    | { type: 'SYSTEM_INITIALIZED'; structureId: string | null; isReady: boolean }
    | { type: 'ERROR_OCCURRED'; error: string }
    | { type: 'NAVIGATE_TO_SETTINGS' }
    | { type: 'NAVIGATE_TO_NOTIFICATIONS' };

export const NAVIGATE_TO_SETTINGS = (): Msg => ({ type: 'NAVIGATE_TO_SETTINGS' });
export const NAVIGATE_TO_NOTIFICATIONS = (): Msg => ({ type: 'NAVIGATE_TO_NOTIFICATIONS' });