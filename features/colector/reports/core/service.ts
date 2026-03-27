import { Agency } from '@/shared/repositories/structure/domain/models';
import { ListeroDetails, structureRepository } from '@/shared/repositories/structure';
import { incidentRepository } from '@/shared/repositories/incident';
import { drawRepository } from '@/shared/repositories/draw';

export interface SubmitIncidentPayload {
  structure: number;
  draw: number | null;
  incident_type: string;
  description: string;
}

export interface ReportsService {
  getListeros: (structureId: number) => Promise<Agency[]>;
  getDraws: (listeroId: number) => Promise<ListeroDetails>;
  submitIncident: (payload: SubmitIncidentPayload) => Promise<void>;
}

export interface ReportsServiceDeps {
  getListeros: (structureId: number) => Promise<Agency[]>;
  getDraws: (listeroId: number) => Promise<ListeroDetails>;
  createIncident: (payload: SubmitIncidentPayload) => Promise<unknown>;
  updateDrawStatus: (drawId: number, status: 'reported') => Promise<void>;
}

const defaultDeps: ReportsServiceDeps = {
  getListeros: (structureId) => structureRepository.getChildren(structureId),
  getDraws: (listeroId) => structureRepository.getListeroDetails(listeroId),
  createIncident: (payload) => incidentRepository.create(payload),
  updateDrawStatus: (drawId, status) => drawRepository.updateStatus(drawId, status),
};

export const createReportsService = (deps: ReportsServiceDeps = defaultDeps): ReportsService => ({
  getListeros: (structureId) => deps.getListeros(structureId),
  getDraws: (listeroId) => deps.getDraws(listeroId),
  submitIncident: async (payload) => {
    await deps.createIncident(payload);
    if (payload.draw) {
      await deps.updateDrawStatus(payload.draw, 'reported');
    }
  },
});
