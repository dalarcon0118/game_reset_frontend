/**
 * 🎰 Tipos de Apuestas Centralizados
 * 
 * Este archivo define los tipos de apuestas y sus schemas de visualización
 * de manera centralizada para mantener consistencia en toda la aplicación.
 * 
 * NORMAS DE ESTANDARIZACIÓN:
 * - type: Siempre usar valores de BET_TYPE_KEYS (enum)
 * - betTypeId: Siempre string del ID del backend
 * - numbers: Siempre string (para almacenamiento)
 * - ownerStructure: Siempre string
 */

import { logger } from '@/shared/utils/logger';

import { GameRegistry } from '../core/registry/game_registry';

const log = logger.withTag('BET_TYPES');

/**
 * Mapeo canónico de IDs del backend a tipos de apuesta.
 * @deprecated 🛑 SSOT VIOLATION: Se debe migrar al uso de GameRegistry.getCategoryByBetCode(code).
 * Este mapa es estático y no refleja cambios en el backend sin una actualización de la App.
 */
export const BET_TYPE_ID_MAP: Record<string, BetTypeKind> = {
    '10': 'Lotería',
    '13': 'Lotería',
    '1': 'Fijo',
    '2': 'Corrido',
    '3': 'Parlet',
    '4': 'Centena',
    '5': 'Cuaterna Semanal',
    '6': 'Quiniela',
};

/**
 * Mapeo inverso: tipo -> ID del backend (para guardado)
 * @deprecated 🛑 SSOT VIOLATION: Se debe migrar al uso de CÓDIGOS estables del backend.
 */
export const BET_TYPE_TO_ID_MAP: Record<BetTypeKind, string> = {
    'Lotería': '10',
    'Fijo': '1',
    'Corrido': '2',
    'Parlet': '3',
    'Centena': '4',
    'Cuaterna Semanal': '5',
    'Quiniela': '6',
    'Fijo/Corrido': '1',
};

/**
 * Normaliza el valor de type al formato canónico.
 * Maneja: tildes, mayúsculas, variants.
 */
export const normalizeBetType = (type: string | number): BetTypeKind => {
    const typeStr = String(type).toUpperCase();

    // 1. Prioridad: GameRegistry (Contrato de Códigos Estables del Backend)
    // Esto asegura que si el backend cambia el nombre pero mantiene el código, el frontend responda correctamente.
    const category = GameRegistry.getCategoryByBetCode(typeStr);
    if (category === 'loteria') return 'Lotería';
    if (category === 'bolita') {
        // Mapeo refinado para bolita basado en el código si es posible
        if (typeStr === 'FIJO') return 'Fijo';
        if (typeStr === 'PARLET') return 'Parlet';
        if (typeStr === 'CORRIDO') return 'Corrido';
        if (typeStr === 'CENTENA') return 'Centena';
        return 'Fijo'; // Default bolita
    }

    // 2. Prioridad: Mapa de IDs numéricos (Legacy SSOT del Backend)
    // Solo se usa si no se reconoce el código alfanumérico.
    if (BET_TYPE_ID_MAP[typeStr]) {
        return BET_TYPE_ID_MAP[typeStr];
    }

    // 3. Coincidencia exacta con llaves canónicas
    const exactMatch = Object.values(BET_TYPE_KEYS).find(
        (key) => key.toUpperCase() === typeStr
    );
    if (exactMatch) return exactMatch as BetTypeKind;

    // 4. Coincidencias parciales o alias (Case-insensitive)
    if (typeStr.includes('PARLET')) return 'Parlet';
    if (typeStr.includes('CENTENA')) return 'Centena';
    if (typeStr.includes('CORRIDO')) return 'Corrido';
    if (typeStr.includes('FIJO')) return 'Fijo';
    if (typeStr.includes('LOT')) return 'Lotería';
    if (typeStr.includes('CUAT')) return 'Lotería';

    return 'Fijo';
};

/**
 * Normaliza betTypeId al formato canónico.
 * Si es un número, lo convierte a string.
 * Si es un string que ya es un tipo (como 'Fijo'), lo convierte al ID.
 */
export const normalizeBetTypeId = (value: string | number | undefined | null): string => {
    if (!value) return '1'; // Default Fijo

    const strValue = String(value);

    // Si es un ID numérico conocido, devolverlo
    if (BET_TYPE_ID_MAP[strValue]) {
        return strValue;
    }

    // Si es un nombre de tipo, convertir al ID
    const normalizedType = normalizeBetType(strValue);
    return BET_TYPE_TO_ID_MAP[normalizedType] || '1';
};

/**
 * Normaliza el campo numbers a string.
 * El almacenamiento SIEMPRE debe usar string.
 */
export const normalizeNumbers = (value: unknown): string => {
    if (value === null || value === undefined) return '';

    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (Array.isArray(value)) return value.join('-');
    if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        if ('number' in obj) return normalizeNumbers(obj.number);
        if ('bet' in obj) return normalizeNumbers(obj.bet);
        if ('numbers' in obj) return normalizeNumbers(obj.numbers);
    }

    return String(value);
};

/**
 * Normaliza ownerStructure a string.
 */
export const normalizeOwnerStructure = (value: string | number | undefined | null): string => {
    if (!value) return '';
    return String(value);
};

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
 * 
 * Esta función NO usa valores hardcodeados de ID. En su lugar:
 * - Si se proporcionan knownLoteriaIds, los usa para verificar
 * - Otherwise usa el nombre/tipo como fallback
 * 
 * @param type - El nombre/tipo de la apuesta (ej: 'Lotería', 'Cuaterna Semanal')
 * @param betTypeId - El ID del tipo de apuesta del backend (opcional)
 * @param knownLoteriaIds - Array de IDs de lotería identificados del backend (opcional)
 */
export const isLoteriaType = (
    type: string,
    betTypeId?: string | number,
    knownLoteriaIds?: string[]
): boolean => {
    // PRIORIDAD 1: Si tenemos los IDs de lotería conocidos del backend, verificar contra ellos
    if (knownLoteriaIds && knownLoteriaIds.length > 0 && betTypeId) {
        const betTypeIdStr = String(betTypeId);
        if (knownLoteriaIds.includes(betTypeIdStr)) {
            return true;
        }
    }

    // PRIORIDAD 2: Verificar por nombre/tipo usando keywords del registro
    // Este es un fallback que funciona sin conocer los IDs del backend
    const normalized = type.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return normalized === BET_TYPE_KEYWORDS.LOTERIA ||
        normalized === BET_TYPE_KEYWORDS.LOTERIA_ACCENT ||
        normalized.includes(BET_TYPE_KEYWORDS.CUATERNA) ||
        normalized.includes(BET_TYPE_KEYWORDS.SEMANAL);
};

// Las funciones de normalización ya están exportadas con 'export const'
