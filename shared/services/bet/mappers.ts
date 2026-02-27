/**
 * Mapeador de datos de apuestas - Transforma datos del storage al formato esperado por Pydantic
 * 
 * Este mapper asegura que los datos almacenados en offline sean convertidos
 * al formato exacto que el backend (Pydantic) espera.
 */

import { CreateBetDTO } from './types';
import { logger } from '../../utils/logger';

const log = logger.withTag('BET_MAPPER');

// ============================================================================
// INTERFACES PARA DATOS TRANSFORMADOS
// ============================================================================

/**
 * Formato esperado por el backend (Pydantic schemas)
 */
export interface FijoCorridoBackend {
    id: string;
    bet: number;
    fijoAmount?: string | number;
    corridoAmount?: string | number;
    betTypeid?: string | number;
    drawid?: string | number;
}

export interface CentenaBackend {
    id: string;
    bet: number;
    amount: string | number;
    betTypeid?: string | number;
    drawid?: string | number;
}

export interface ParletBackend {
    id: string;
    bets: number[];
    amount: string | number;
    betTypeid?: string | number;
    drawid?: string | number;
}

export interface LoteriaBackend {
    id: string;
    bet: string;
    amount: string | number;
    betTypeid?: string | number;
    drawid?: string | number;
}

/**
 * Payload final que el backend espera
 */
export interface BetCreationPayloadBackend {
    drawId: number;
    receiptCode?: string;
    fijosCorridos: FijoCorridoBackend[];
    centenas: CentenaBackend[];
    parlets: ParletBackend[];
    loteria: LoteriaBackend[];
    bets?: any[];
}

// ============================================================================
// FUNCIONES DE TRANSFORMACIÓN
// ============================================================================

/**
 * Convierte un valor a string para el backend (Pydantic espera Decimal como string o número)
 */
const toBackendAmount = (value: any): string | number => {
    if (value === undefined || value === null) {
        return 0;
    }
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }
    if (typeof value === 'number') {
        return value;
    }
    // Si es un objeto Decimal de alguna librería, convertir a string
    if (typeof value === 'object' && value.toString) {
        return value.toString();
    }
    return 0;
};

/**
 * Transforma un item de fijo/corrido al formato del backend
 */
const transformFijoCorrido = (item: any): FijoCorridoBackend => {
    return {
        id: item.id || item.offlineId || `fc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        bet: typeof item.bet === 'number' ? item.bet : parseInt(item.bet, 10),
        fijoAmount: item.fijoAmount !== undefined ? toBackendAmount(item.fijoAmount) : undefined,
        corridoAmount: item.corridoAmount !== undefined ? toBackendAmount(item.corridoAmount) : undefined,
        betTypeid: item.betTypeid,
        drawid: item.drawid,
    };
};

/**
 * Transforma un item de centena al formato del backend
 */
const transformCentena = (item: any): CentenaBackend => {
    return {
        id: item.id || item.offlineId || `c-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        bet: typeof item.bet === 'number' ? item.bet : parseInt(item.bet, 10),
        amount: toBackendAmount(item.amount),
        betTypeid: item.betTypeid,
        drawid: item.drawid,
    };
};

/**
 * Transforma un item de parlet al formato del backend
 */
const transformParlet = (item: any): ParletBackend => {
    // Parlet puede tener 'bets' como array de números o como array de strings
    let betsArray: number[];

    if (Array.isArray(item.bets)) {
        betsArray = item.bets.map((b: any) => typeof b === 'number' ? b : parseInt(b, 10));
    } else if (typeof item.bets === 'string') {
        // Si es un string JSON, parsearlo
        try {
            betsArray = JSON.parse(item.bets);
        } catch {
            betsArray = [];
        }
    } else {
        betsArray = [];
    }

    return {
        id: item.id || item.offlineId || `p-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        bets: betsArray,
        amount: toBackendAmount(item.amount),
        betTypeid: item.betTypeid,
        drawid: item.drawid,
    };
};

/**
 * Transforma un item de lotería al formato del backend
 */
const transformLoteria = (item: any): LoteriaBackend => {
    return {
        id: item.id || item.offlineId || `l-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        bet: String(item.bet || item.number || ''),
        amount: toBackendAmount(item.amount),
        betTypeid: item.betTypeid,
        drawid: item.drawid,
    };
};

/**
 * Transforma los datos de apuesta del formato storage al formato backend
 * 
 * @param betData - Datos crudos de la apuesta desde el storage
 * @returns Payload formateado para el backend
 */
export const transformBetToBackend = (betData: Partial<CreateBetDTO>): BetCreationPayloadBackend => {
    log.info('Transforming bet data to backend format', {
        hasFijosCorridos: !!betData.fijosCorridos,
        hasCentenas: !!betData.centenas,
        hasParlet: !!betData.parlets,
        hasLoteria: !!betData.loteria,
    });

    // 1. Transformar drawId a número
    let drawId: number;
    if (typeof betData.drawId === 'number') {
        drawId = betData.drawId;
    } else if (typeof betData.drawId === 'string') {
        drawId = parseInt(betData.drawId, 10);
    } else if (typeof betData.draw === 'number') {
        drawId = betData.draw;
    } else if (typeof betData.draw === 'string') {
        drawId = parseInt(betData.draw, 10);
    } else {
        log.error('drawId is missing or invalid', { drawId: betData.drawId, draw: betData.draw });
        drawId = 0;
    }

    // 2. Transformar cada tipo de apuesta
    const fijosCorridos: FijoCorridoBackend[] = (betData.fijosCorridos || [])
        .filter((item: any) => item && (item.fijoAmount || item.corridoAmount))
        .map(transformFijoCorrido);

    const centenas: CentenaBackend[] = (betData.centenas || [])
        .filter((item: any) => item && item.amount)
        .map(transformCentena);

    const parlets: ParletBackend[] = (betData.parlets || [])
        .filter((item: any) => item && item.bets && item.amount)
        .map(transformParlet);

    const loteria: LoteriaBackend[] = (betData.loteria || [])
        .filter((item: any) => item && item.bet && item.amount)
        .map(transformLoteria);

    const result: BetCreationPayloadBackend = {
        drawId,
        receiptCode: betData.receiptCode,
        fijosCorridos,
        centenas,
        parlets,
        loteria,
        bets: betData.bets, // Pasamos el array de apuestas genéricas si existe
    };

    log.info('Transformed bet data', {
        drawId: result.drawId,
        fijosCount: result.fijosCorridos.length,
        centenasCount: result.centenas.length,
        parletsCount: result.parlets.length,
        loteriaCount: result.loteria.length,
    });

    return result;
};

/**
 * Valida que el payload transformado tenga al menos una apuesta válida
 */
export const validateBetPayload = (payload: BetCreationPayloadBackend): { valid: boolean; error?: string } => {
    if (!payload.drawId || payload.drawId <= 0) {
        return { valid: false, error: 'Invalid drawId' };
    }

    const hasAnyBet =
        (payload.fijosCorridos && payload.fijosCorridos.length > 0) ||
        (payload.centenas && payload.centenas.length > 0) ||
        (payload.parlets && payload.parlets.length > 0) ||
        (payload.loteria && payload.loteria.length > 0) ||
        (payload.bets && payload.bets.length > 0);

    if (!hasAnyBet) {
        return { valid: false, error: 'No valid bets in payload' };
    }

    return { valid: true };
};

/**
 * Crea un payload de apuesta válido para el backend
 * Combina transformación y validación
 */
export const createValidBetPayload = (betData: Partial<CreateBetDTO>): BetCreationPayloadBackend | null => {
    const transformed = transformBetToBackend(betData);
    const validation = validateBetPayload(transformed);

    if (!validation.valid) {
        log.error('Bet payload validation failed', { error: validation.error, betData });
        return null;
    }

    return transformed;
};
