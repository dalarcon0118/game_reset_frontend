import { DrawApi } from './api/api';
import { DrawRepository } from './draw.repository';

export * from './draw.ports';

/**
 * Instancia única del repositorio de sorteos (Singleton)
 * Sigue el patrón Offline-First con Inyección de Dependencias.
 */
export const drawRepository = new DrawRepository(
    DrawApi
);
