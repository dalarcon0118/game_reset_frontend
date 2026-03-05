import { Result, ok, err } from 'neverthrow';
import { BetPlacementInput } from './bet.types';

export interface BetPlacementCandidate {
    drawId: string | number;
    betTypeId: string | number;
    numbers: unknown;
    amount: number | string | null | undefined;
    ownerStructure: string | number | null | undefined;
    receiptCode?: string;
}

const normalizeAmount = (value: BetPlacementCandidate['amount']): Result<number, Error> => {
    const amount = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(amount) || amount <= 0) {
        return err(new Error(`ERROR_CRITICO: Monto inválido (${String(value)})`));
    }
    return ok(amount);
};

const normalizeOwnerStructure = (
    value: BetPlacementCandidate['ownerStructure']
): Result<string | number, Error> => {
    if (value === null || value === undefined) {
        return err(new Error('ERROR_CRITICO: ownerStructure es obligatorio'));
    }
    const normalized = typeof value === 'string' ? value.trim() : value;
    if (normalized === '') {
        return err(new Error('ERROR_CRITICO: ownerStructure es obligatorio'));
    }
    return ok(normalized);
};

export const BetMapper = {
    toPlacementInput: (candidate: BetPlacementCandidate): Result<BetPlacementInput, Error> => {
        const amountResult = normalizeAmount(candidate.amount);
        if (amountResult.isErr()) return err(amountResult.error);

        const ownerStructureResult = normalizeOwnerStructure(candidate.ownerStructure);
        if (ownerStructureResult.isErr()) return err(ownerStructureResult.error);

        return ok({
            drawId: candidate.drawId,
            betTypeId: candidate.betTypeId,
            numbers: candidate.numbers,
            amount: amountResult.value,
            ownerStructure: ownerStructureResult.value,
            receiptCode: candidate.receiptCode
        });
    },
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
