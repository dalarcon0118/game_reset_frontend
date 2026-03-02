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
     * 
     * IMPORTANTE: Usa structureId del usuario (model.structureId) en lugar de owner_structure del draw.
     * Esto asegura que el registro financiero se asocie correctamente a la estructura del usuario actual,
     * que es la misma estructura que usa el Dashboard para mostrar los resumenes financieros.
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

        // Obtener detalles del sorteo para extraer la estructura (fallback)
        const drawDetails = model.managementSession.drawDetails.type === 'Success'
            ? model.managementSession.drawDetails.data
            : null;

        // USAR structureId del usuario actual como fuente de verdad
        // Si no está disponible, caer a owner_structure del draw (fallback)
        const effectiveStructureId = model.structureId
            ? String(model.structureId)
            : String(drawDetails?.owner_structure || '');

        return {
            drawId,
            loteria: betsWithId,
            receiptCode,
            amount: model.summary.loteriaTotal, // Monto total para el Ledger financiero
            owner_structure: effectiveStructureId // Estructura del usuario actual
        };
    }
};
