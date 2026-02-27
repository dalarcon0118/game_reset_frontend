import { LoteriaFeatureModel } from '../feature.types';
import { SessionLogic } from './session.logic';
import { CalculationLogic } from './calculation.logic';
import logger from '@/shared/utils/logger';
const log = logger.withTag('[PersistenceLogic]');
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
     */
    createSavePayload: (model: LoteriaFeatureModel, drawId: string): any => {
        const receiptCode = model.summary.pendingReceiptCode || CalculationLogic.generateReceiptCode();
        const loteriaBetTypeId = model.managementSession.betTypes.loteria;

        // Inyectamos betTypeid en cada apuesta para cumplir con el nuevo contrato basado en IDs
        const betsWithId = model.entrySession.loteria.map(bet => ({
            ...bet,
            betTypeid: loteriaBetTypeId,
            drawid: drawId
        }));

        return {
            drawId,
            loteria: betsWithId,
            receiptCode
        };
    }
};
