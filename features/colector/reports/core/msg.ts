import { WebData } from '@core/tea-utils';
import { Agency } from '@/shared/repositories/structure/domain/models';
import { ListeroDetails } from '@/shared/repositories/structure';

export type Msg =
  | { type: 'FORM_INIT'; userStructureId: number; listeroId?: number; drawId?: number }
  | { type: 'LISTEROS_RECEIVED'; webData: WebData<Agency[]> }
  | { type: 'LISTERO_SELECTED'; row: number }
  | { type: 'DRAWS_RECEIVED'; webData: WebData<ListeroDetails> }
  | { type: 'DRAW_SELECTED'; row: number }
  | { type: 'INCIDENT_TYPE_SELECTED'; row: number }
  | { type: 'DESCRIPTION_CHANGED'; description: string }
  | { type: 'SUBMIT_REQUESTED' }
  | { type: 'SUBMIT_SUCCEEDED' }
  | { type: 'SUBMIT_FAILED'; error: string };
