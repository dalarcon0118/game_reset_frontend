import { Result, ok, err } from 'neverthrow';
import { BetPlacementInput } from './bet.types';
import { normalizeBetType, normalizeBetTypeId, normalizeNumbers, normalizeOwnerStructure as normalizeOwnerStructureFn, BET_TYPE_ID_MAP } from '@/shared/types/bet_types';

/**
 * Interfaz para candidato de apuesta durante la creación.
 * Define el contrato de entrada para el mapper.
 */
export interface BetPlacementCandidate {
    drawId: string | number;
    betTypeId: string | number;
    numbers: unknown;
    amount: number | string | null | undefined;
    ownerStructure: string | number | null | undefined;
    receiptCode?: string;
    type?: string; // Nombre del tipo de apuesta (ej: 'Lotería', 'Fijo', etc.)
}

/**
 * Normaliza el amount a número.
 */
const normalizeAmount = (value: BetPlacementCandidate['amount']): Result<number, Error> => {
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
): Result<string, Error> => {
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
 * Usa el mapeo centralizado de bet_types.ts
 */
const inferBetType = (candidate: BetPlacementCandidate): string => {
    // PRIORIDAD 1: Si ya tiene type, normalizarlo
    if (candidate.type) {
        return normalizeBetType(candidate.type);
    }

    // PRIORIDAD 2: Inferir desde betTypeId usando mapeo centralizado
    const betTypeIdStr = String(candidate.betTypeId || '');
    const mappedType = BET_TYPE_ID_MAP[betTypeIdStr];
    if (mappedType) {
        return mappedType;
    }

    // Default a Fijo
    return 'Fijo';
};

/**
 * Infiere el betTypeId canonical (string del ID del backend)
 */
const inferBetTypeId = (candidate: BetPlacementCandidate): string => {
    return normalizeBetTypeId(candidate.betTypeId);
};

export const BetMapper = {
    /**
     * Convierte un candidato de apuesta en un BetPlacementInput validado.
     * Aplica normalización centralizada para asegurar consistencia.
     */
    toPlacementInput: (candidate: BetPlacementCandidate): Result<BetPlacementInput, Error> => {
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

        return ok({
            drawId: String(candidate.drawId),
            betTypeId: normalizedBetTypeId,
            type: normalizedType,
            numbers: normalizedNumbers,
            amount: amountResult.value,
            ownerStructure: ownerStructureResult.value,
            receiptCode: candidate.receiptCode
        });
    },

    /**
     * Convierte un array de candidatos en un array de BetPlacementInput.
     * Si algún candidato falla, retorna error inmediatamente.
     */
    toPlacementBatch: (candidates: BetPlacementCandidate[]): Result<BetPlacementInput[], Error> => {
        const mapped: BetPlacementInput[] = [];
        for (const candidate of candidates) {
            const result = BetMapper.toPlacementInput(candidate);
            if (result.isErr()) return err(result.error);
            mapped.push(result.value);
        }
        return ok(mapped);
    }
};
