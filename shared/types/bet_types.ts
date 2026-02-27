/**
 * 🎰 Tipos de Apuestas Centralizados
 * 
 * Este archivo define los tipos de apuestas y sus schemas de visualización
 * de manera centralizada para mantener consistencia en toda la aplicación.
 */

import { logger } from '@/shared/utils/logger';

const log = logger.withTag('BET_TYPES');

/**
 * Valores literales para cada tipo de apuesta (como constantes)
 */
export const BET_TYPE_KEYS = {
    FIJO: 'Fijo',
    PARLET: 'Parlet',
    CORRIDO: 'Corrido',
    CENTENA: 'Centena',
    LOTERIA: 'Loteria',
    CUATERNA_SEMANAL: 'Cuaterna Semanal',
    FIJO_CORRIDO: 'Fijo/Corrido',
    QUINELA: 'Quiniela'
} as const;

export type BetTypeKind = string;

/**
 * Alias para compatibilidad hacia atrás
 */
export type BetTypeValue = BetTypeKind;

/**
 * Schema de visualización para cada tipo de apuesta
 * Define cómo se dividen los números para mostrarse en el UI
 * 
 * - number[]:分割分组 (ej: [1, 2, 2] = 1 dígito, 2 dígitos, 2 dígitos)
 * - 'pairs-from-right': agrupa pares desde la derecha
 */
export const BET_TYPE_SCHEMA: Record<BetTypeKind, number[] | 'pairs-from-right'> = {
    [BET_TYPE_KEYS.FIJO]: [2],
    [BET_TYPE_KEYS.CORRIDO]: [2],
    [BET_TYPE_KEYS.PARLET]: [2, 2],
    [BET_TYPE_KEYS.CENTENA]: [3],
    [BET_TYPE_KEYS.LOTERIA]: [1, 2, 2],  // 5 dígitos: 1 + 25 + 10
    [BET_TYPE_KEYS.CUATERNA_SEMANAL]: 'pairs-from-right'
};

/**
 * Obtiene el schema de visualización para un tipo de apuesta
 * Maneja normalización automática (tildes, mayúsculas)
 */
export const getBetVisualSchema = (type: string): number[] | 'pairs-from-right' => {
    // Normalizar: quitar tildes y convertir a minúsculas para comparación flexible
    const normalizeString = (str: string): string =>
        str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const normalizedInput = normalizeString(type);

    // Buscar coincidencia en las claves del enum
    for (const [key, value] of Object.entries(BET_TYPE_KEYS)) {
        if (normalizeString(value) === normalizedInput) {
            log.debug(`Schema found for type: ${type}`, { key, value });
            return BET_TYPE_SCHEMA[value as BetTypeKind];
        }
    }

    // Si no encuentra coincidencia exacta, buscar por substring
    for (const [key, value] of Object.entries(BET_TYPE_SCHEMA)) {
        if (normalizedInput.includes(normalizeString(key))) {
            log.debug(`Schema found by substring for type: ${type}`, { key });
            return value;
        }
    }

    log.warn(`No schema found for type: ${type}, using default`, { type });
    return 'pairs-from-right';
};

/**
 * Verifica si un tipo de apuesta es válido
 */
export const isValidBetType = (type: string): boolean => {
    const normalizedInput = type.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    return Object.values(BET_TYPE_KEYS).some(value =>
        value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalizedInput
    );
};

/**
 * Lista de todos los tipos de apuesta (para iteraciones)
 */
export const BET_TYPE_VALUES: BetTypeKind[] = Object.values(BET_TYPE_KEYS);

/**
 * Mapeo de códigos de backend a tipos de frontend
 */
export const BACKEND_BET_CODES = {
    LOTERIA: 'LOTERIA',
    CUATERNA: 'CUATERNA',
    WEEKLY: 'LS_WEEKLY',
    PARLET: 'PARLET',
    CORRIDO: 'CORRIDO',
    CENTENA: 'CENTENA',
    FIJO: 'FIJO',
    QUINIELA: 'QUINIELA',
    CUATERNA_SEMANAL: 'CUATERNA_SEMANAL'
} as const;

/**
 * Palabras clave para identificación por nombre (fallback)
 */
export const BET_TYPE_KEYWORDS = {
    LOTERIA: 'LOTERIA',
    LOTERIA_ACCENT: 'LOTERÍA',
    CUATERNA: 'CUATERNA',
    SEMANAL: 'SEMANAL',
    FIJO: 'FIJO',
    PARLET: 'PARLET',
    CORRIDO: 'CORRIDO',
    CENTENA: 'CENTENA'
} as const;

/**
 * Constantes de UI y Delimitadores
 */
export const UI_CONSTANTS = {
    PENDING_OFFLINE_PREFIX: 'P-OFFLINE',
    EMPTY_RECEIPT_CODE: '-----',
    BET_NUMBER_DELIMITER: '-',
    UNKNOWN_TYPE: 'Unknown',
    OFFLINE_ID_PREFIX: 'offline',
    FIJO_LABEL: 'fijo',
    CORRIDO_LABEL: 'corrido',
    PARLET_LABEL: 'parlet',
    CENTENA_LABEL: 'centena',
    LOTERIA_LABEL: 'loteria',
    DEFAULT_LOCALE: 'es-ES',
} as const;

/**
 * Verifica si el tipo de apuesta requiere formato especial para Lotería
 * (útil para determinar si es un juego de 5 dígitos)
 */
export const isLoteriaType = (type: string, betTypeId?: string | number): boolean => {
    // Si tenemos betTypeId, deberíamos idealmente compararlo contra una lista de IDs conocidos
    // o confiar en que la lógica de negocio ya lo clasificó.
    // Por ahora, mantenemos la normalización pero priorizamos consistencia.
    const normalized = type.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return normalized === BET_TYPE_KEYWORDS.LOTERIA ||
        normalized === BET_TYPE_KEYWORDS.LOTERIA_ACCENT ||
        normalized.includes(BET_TYPE_KEYWORDS.CUATERNA) ||
        normalized.includes(BET_TYPE_KEYWORDS.SEMANAL);
};
