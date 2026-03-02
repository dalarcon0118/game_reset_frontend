import { IIncidentRepository } from './incident.ports';
import { IncidentApiAdapter } from './adapters/incident.api.adapter';

export * from './incident.ports';
export * from './api/types/types';

export const incidentRepository: IIncidentRepository = new IncidentApiAdapter();
