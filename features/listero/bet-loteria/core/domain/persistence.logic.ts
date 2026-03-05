import { LoteriaFeatureModel } from '../feature.types';
import { SessionLogic } from './session.logic';
import { CalculationLogic } from './calculation.logic';
import { Result } from 'neverthrow';
import { BetMapper } from '@/shared/repositories/bet/bet.mapper';
import { BetPlacementInput } from '@/shared/repositories/bet/bet.types';
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
            pendingReceiptCode: CalculationLogic.generateReceiptCode()
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
     */
    createSavePayload: (model: LoteriaFeatureModel, drawId: string): Result<BetPlacementInput[], Error> => {
        const receiptCode = model.summary.pendingReceiptCode || CalculationLogic.generateReceiptCode();
        const loteriaBetTypeId = model.managementSession.betTypes.loteria;

        // Obtener detalles del sorteo para extraer la estructura (fallback)
        const drawDetails = model.managementSession.drawDetails.type === 'Success'
            ? model.managementSession.drawDetails.data
            : null;

        // USAR structureId del usuario actual como fuente de verdad
        const effectiveStructureId = model.structureId
            ? String(model.structureId)
            : String(drawDetails?.owner_structure || '');

        // Retornamos un array de apuestas individuales compatibles con BetDomainModel
        const candidates = model.entrySession.loteria.map(bet => ({
            drawId,
            betTypeId: loteriaBetTypeId || '',
            numbers: bet.bet,
            amount: bet.amount,
            receiptCode,
            ownerStructure: effectiveStructureId
        }));

        return BetMapper.toPlacementBatch(candidates);
    }
};
