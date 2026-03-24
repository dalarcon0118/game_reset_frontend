import { LoteriaFeatureModel } from '../feature.types';
import { SessionLogic } from './session.logic';
import { Result, err, ok } from 'neverthrow';
import { BetPlacementInput } from '@/shared/repositories/bet/bet.types';
import { normalizeBetType, normalizeNumbers, normalizeOwnerStructure, resolveLoteriaBetTypeId, BET_TYPE_KEYS } from '@/shared/types/bet_types';

const resolveOwnerStructure = (model: LoteriaFeatureModel): string => {
    if (model.structureId) {
        return String(model.structureId);
    }
    if (model.managementSession.drawDetails.type === 'Success') {
        return String(model.managementSession.drawDetails.data.owner_structure || '');
    }
    return '';
};

const createBetPayload = (
    drawId: string,
    loteriaBetTypeId: string,
    normalizedOwnerStructure: string,
    bet: { bet: string; amount?: number | null }
): BetPlacementInput => ({
    drawId,
    betTypeId: loteriaBetTypeId,
    type: normalizeBetType(BET_TYPE_KEYS.LOTERIA),
    numbers: normalizeNumbers(bet.bet),
    amount: bet.amount ?? 0,
    ownerStructure: normalizedOwnerStructure
});

/**
 * 💾 PERSISTENCE LOGIC
 * Manages the state transitions related to saving data.
 * Does NOT perform the actual saving (that's an Effect/Cmd), but prepares the state for it.
 */
export const PersistenceLogic = {
    /**
     * Prepares the model for saving (loading state, clearing errors, generating receipt code).
     */
    prepareSave: (model: LoteriaFeatureModel): LoteriaFeatureModel => ({
        ...model,
        summary: {
            ...model.summary,
            isSaving: true,
            error: null,
            pendingReceiptCode: null // Ahora lo maneja el repositorio
        }
    }),

    /**
     * Handles a successful save operation.
     * Clears the session and updates the summary.
     */
    handleSaveSuccess: (model: LoteriaFeatureModel): LoteriaFeatureModel => {
        // Clear all bets on success
        const clearedModel = SessionLogic.syncState(model, []);
        return {
            ...clearedModel,
            summary: {
                ...clearedModel.summary,
                isSaving: false,
                error: null,
                pendingReceiptCode: null // Clear the code after successful save
            }
        };
    },

    /**
     * Handles a failed save operation.
     * Stores the error message and stops loading.
     */
    handleSaveFailure: (model: LoteriaFeatureModel, error: string): LoteriaFeatureModel => ({
        ...model,
        summary: { ...model.summary, isSaving: false, error }
    }),

    /**
     * Generates the payload required for the backend.
     * 
     * IMPORTANTE: Ahora retorna un array de apuestas compatibles con BetDomainModel.
     * Esto permite usar betRepository.placeBatch para un manejo offline-first consistente.
     * 
     * APLICAMOS NORMALIZACIÓN CENTRALIZADA:
     * - type: normalizado usando normalizeBetType
     * - betTypeId: normalizado usando normalizeBetTypeId (SSOT dinámico)
     * - numbers: normalizado a string usando normalizeNumbers
     * - ownerStructure: normalizado a string usando normalizeOwnerStructure
     */
    createSavePayload: (model: LoteriaFeatureModel, drawId: string): Result<BetPlacementInput[], Error> => {
        const betTypes = model.managementSession.betTypes;

        if (betTypes.type !== 'Success') {
            return err(new Error('Tipos de apuesta no disponibles. El catálogo debe estar cargado (SSOT).'));
        }

        const loteriaBetTypeId = resolveLoteriaBetTypeId(betTypes.data);

        if (!loteriaBetTypeId) {
            return err(new Error('Configuración de Lotería no encontrada en el catálogo dinámico (Se buscó LOTERIA o CUATERNA).'));
        }

        const normalizedOwnerStructure = normalizeOwnerStructure(resolveOwnerStructure(model));

        try {
            const payload = model.entrySession.loteria.map((bet) =>
                createBetPayload(drawId, loteriaBetTypeId, normalizedOwnerStructure, bet)
            );
            return ok(payload);
        } catch (e) {
            return err(e instanceof Error ? e : new Error(String(e)));
        }
    }
};
