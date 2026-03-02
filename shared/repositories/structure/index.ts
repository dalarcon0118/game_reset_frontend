import { IStructureRepository } from './structure.ports';
import { StructureApiAdapter } from './adapters/structure.api.adapter';

export * from './structure.ports';
export const structureRepository: IStructureRepository = new StructureApiAdapter();
