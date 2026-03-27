import { WebData, RemoteData } from '@core/tea-utils';
import { Agency } from '@/shared/repositories/structure/domain/models';
import { ListeroDetails } from '@/shared/repositories/structure';

export const INCIDENT_TYPES = [
  { title: 'Diferencia de Monto' },
  { title: 'Premio No Registrado' },
  { title: 'Premio No Pagado' },
  { title: 'Jugadas anotadas incorrectamente' },
  { title: 'Inyección de nuevos fondos' },
  { title: 'Otro' },
];

export interface Model {
  userStructureId: number | null;
  routeListeroId: number | null;
  routeDrawId: number | null;
  selectedListeroRow: number;
  selectedDrawRow: number;
  selectedTypeRow: number;
  description: string;
  submission: RemoteData<string, null>;
  listeros: WebData<Agency[]>;
  drawsDetail: WebData<ListeroDetails>;
}

export const initialModel: Model = {
  userStructureId: null,
  routeListeroId: null,
  routeDrawId: null,
  selectedListeroRow: 0,
  selectedDrawRow: 0,
  selectedTypeRow: 0,
  description: '',
  submission: RemoteData.notAsked(),
  listeros: RemoteData.notAsked(),
  drawsDetail: RemoteData.notAsked(),
};
