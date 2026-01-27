import { WebData } from '@/shared/core/remote.data';
import { ChildStructure } from '@/shared/services/Structure';

export type Msg =
    | { type: 'INIT_SCREEN'; id: number }
    | { type: 'FETCH_DATA_REQUESTED' }
    | { type: 'DATA_RECEIVED'; webData: WebData<ChildStructure[]> }
    | { type: 'REFRESH_CLICKED' }
    | { type: 'NAVIGATE_BACK' }
    | { type: 'LISTERIA_SELECTED'; listeriaId: number; name: string }
    | { type: 'RULES_PRESSED'; listeriaId: number };

export const INIT_SCREEN = (id: number): Msg => ({ type: 'INIT_SCREEN', id });
export const REFRESH_CLICKED = (): Msg => ({ type: 'REFRESH_CLICKED' });
export const NAVIGATE_BACK = (): Msg => ({ type: 'NAVIGATE_BACK' });
export const LISTERIA_SELECTED = (listeriaId: number, name: string): Msg => ({ type: 'LISTERIA_SELECTED', listeriaId, name });
export const RULES_PRESSED = (listeriaId: number): Msg => ({ type: 'RULES_PRESSED', listeriaId });
