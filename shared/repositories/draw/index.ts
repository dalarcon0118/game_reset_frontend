import { DrawApi } from './api/api';
import { DrawRepository } from './draw.repository';

export * from './draw.ports';

// Exportar tipos y funciones de errores
export * from './types/draw-error.types';
export * from './messages/draw.error-messages';
export * from './mappers/draw.error-mapper';

/**
 * Instancia única del repositorio de sorteos (Singleton)
 * Sigue el patrón Offline-First con Inyección de Dependencias.
 */
export const drawRepository = new DrawRepository(
    DrawApi
);

/**
 * Función para verificar si hay sorteos disponibles en la BD local.
 * Utilizada por el sistema de autenticación para permitir/denegar login offline.
 * 
 * @param skipRemoteFetch - Si es true, no intenta hacer fetch al servidor (modo offline real)
 */
export const hasDrawAvailable = (skipRemoteFetch: boolean = false) => drawRepository.hasDrawAvailable(skipRemoteFetch);
export const hasDrawAvailableForStructure = (structureId: string | number, skipRemoteFetch: boolean = false) => 
    drawRepository.hasDrawAvailableForStructure(structureId, skipRemoteFetch);
