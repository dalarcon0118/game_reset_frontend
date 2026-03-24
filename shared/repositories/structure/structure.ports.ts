import { Agency } from './domain/models';
import { BackendListeroDetails } from './types/types';

/**
 * Domain-aligned type for Listero details.
 * Currently an alias to backend type, but should be its own domain interface.
 */
export type ListeroDetails = BackendListeroDetails;

/**
 * StructurePorts - Repositorio de estructura (Puertos).
 * Define las operaciones disponibles para interactuar con la jerarquía de agencias.
 * Sigue la filosofía Elm: Interfaces claras y tipos de dominio.
 */
export interface StructurePorts {
    /**
     * Obtiene los hijos de un nodo de estructura.
     * Retorna una lista de Agencias (modelo de dominio).
     */
    getChildren: (id: number, level?: number) => Promise<Agency[]>;

    /**
     * Obtiene los detalles de un listero para una fecha específica.
     */
    getListeroDetails: (id: number, date?: string) => Promise<ListeroDetails>;
}
