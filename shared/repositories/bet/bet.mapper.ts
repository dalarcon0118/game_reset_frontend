import { Result, ok, err } from '@/shared/core';
import { BetPlacementInput } from './bet.types';
import { normalizeBetType, normalizeNumbers, normalizeOwnerStructure as normalizeOwnerStructureFn } from '@/shared/types/bet_types';
import { GameRegistry } from '../../core/registry/game_registry';

/**
 * Interfaz para candidato de apuesta durante la creación.
 * Define el contrato de entrada para el mapper.
 */
export interface BetPlacementCandidate {
    drawId: string | number;
    betTypeId: string | number;
    betTypeCode?: string; // Código (FIJO, CORRIDO, PARLET, CENTENA, CUATERNA) - FASE2
    numbers: unknown;
    amount: number | string | null | undefined;
    ownerStructure: string | number | null | undefined;
    receiptCode?: string;
    type?: string; // Nombre del tipo de apuesta (ej: 'Lotería', 'Fijo', etc.)
}

/**
 * Normaliza el amount a número.
 */
const normalizeAmount = (value: BetPlacementCandidate['amount']): Result<Error, number> => {
    const amount = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(amount) || amount <= 0) {
        return err(new Error(`ERROR_CRITICO: Monto inválido (${String(value)})`));
    }
    return ok(amount);
};

/**
 * Normaliza ownerStructure a string.
 */
const normalizeOwnerStructure = (
    value: BetPlacementCandidate['ownerStructure']
): Result<Error, string> => {
    const normalized = normalizeOwnerStructureFn(value);
    if (!normalized) {
        return err(new Error('ERROR_CRITICO: ownerStructure es obligatorio'));
    }
    return ok(normalized);
};

/**
 * Infiere el nombre del tipo de apuesta basándose en el betTypeId.
 * Si el candidate ya tiene un type definido, lo normaliza.
 * 
 * Usa GameRegistry para mapear el comportamiento.
 */
const inferBetType = (candidate: BetPlacementCandidate): string => {
    // PRIORIDAD 1: Si ya tiene type (ej: 'FIJO', 'PARLET'), usarlo directamente
    if (candidate.type) {
        const typeStr = candidate.type.toUpperCase();
        const strategy = GameRegistry.getStrategyByBetCode(typeStr);
        if (strategy) {
            return strategy.label;
        }
        return normalizeBetType(candidate.type);
    }

    // PRIORIDAD 2: Si no tiene type, normalizarlo (fallback legacy)
    return 'Fijo';
};

/**
 * Infiere el betTypeId canonical (string del ID del backend o código)
 * FASE 2: Si tiene betTypeCode, lo usa directamente (más estable que ID)
 */
const inferBetTypeId = (candidate: BetPlacementCandidate): string => {
    // FASE 2: Si tiene betTypeCode (ej: 'FIJO', 'CORRIDO'), usarlo
    if (candidate.betTypeCode) {
        return candidate.betTypeCode.toUpperCase();
    }
    // Comportamiento original: usar betTypeId
    return String(candidate.betTypeId || '');
};

export const BetMapper = {
    /**
     * Convierte un candidato de apuesta en un BetPlacementInput validado.
     * Aplica normalización centralizada para asegurar consistencia.
     */
    toPlacementInput: (candidate: BetPlacementCandidate, ownerUser?: string | number): Result<Error, BetPlacementInput> => {
        // Validar amount
        const amountResult = normalizeAmount(candidate.amount);
        if (amountResult.isErr()) return err(amountResult.error);

        // Normalizar ownerStructure a string
        const ownerStructureResult = normalizeOwnerStructure(candidate.ownerStructure);
        if (ownerStructureResult.isErr()) return err(ownerStructureResult.error);

        // Normalizar type (usando mapeo centralizado)
        const normalizedType = inferBetType(candidate);

        // Normalizar betTypeId al ID canónico del backend
        const normalizedBetTypeId = inferBetTypeId(candidate);

        // Normalizar numbers a string (formato canónico de almacenamiento)
        const normalizedNumbers = normalizeNumbers(candidate.numbers);

        // ✅ Corregido: Usar comparacion explicita, no truthy, porque userId=0 es un valor valido
        const normalizedOwnerUser = ownerUser !== null && ownerUser !== undefined
            ? String(ownerUser)
            : undefined;

        return ok({
            drawId: String(candidate.drawId),
            betTypeId: normalizedBetTypeId,
            type: normalizedType,
            numbers: normalizedNumbers,
            amount: amountResult.value,
            ownerStructure: ownerStructureResult.value,
            ownerUser: normalizedOwnerUser,
            receiptCode: candidate.receiptCode
        });
    },

    /**
     * Convierte un array de candidatos en un array de BetPlacementInput.
     */
    toPlacementBatch: (candidates: BetPlacementCandidate[], ownerUser?: string | number): Result<Error, BetPlacementInput[]> => {
        const mapped: BetPlacementInput[] = [];
        for (const candidate of candidates) {
            const result = BetMapper.toPlacementInput(candidate, ownerUser);
            if (result.isErr()) return err(result.error);
            mapped.push(result.value);
        }
        return ok(mapped);
    }
};
