import { LoteriaFeatureModel } from './feature.types';
import { LoteriaBet, DrawType, GameType } from '@/types';
import { WebData, RemoteData } from '@/shared/core/remote.data';
import { LoteriaState } from '../loteria/loteria.types';
import { calculateLoteriaFixedAmount, DEFAULT_LOTERIA_FIXED_AMOUNT } from '../loteria/loteria.domain';

// Import specialized domain modules
import { InputLogic } from './domain/input.logic';
import { CalculationLogic } from './domain/calculation.logic';
import { SessionLogic } from './domain/session.logic';
import { PersistenceLogic } from './domain/persistence.logic';

import { isLoteriaType } from '@/shared/types/bet_types';

/**
 * 🧠 LOTERIA DOMAIN FACADE
 * This object aggregates all domain logic into a single access point.
 * It coordinates calls between sub-modules (Input, Calculation, Session, Persistence).
 * 
 * Benefits:
 * - Update function remains clean and only imports this Facade.
 * - Logic is physically separated by responsibility (SRP).
 * - Easy to test individual modules.
 * - Easy to change business rules (e.g. fixed amount) in one place.
 */
export const LoteriaDomain = {
    // --- Re-exports & Simple Delegates ---

    generateReceiptCode: CalculationLogic.generateReceiptCode,
    calculateSummary: CalculationLogic.calculateSummary,
    handleKeyPress: InputLogic.handleKeyPress,
    resetInput: SessionLogic.resetInput,
    updateLoteriaSession: SessionLogic.updateLoteriaSession,

    // --- Persistence Flow ---

    prepareSave: PersistenceLogic.prepareSave,
    createSavePayload: PersistenceLogic.createSavePayload,
    handleSaveSuccess: PersistenceLogic.handleSaveSuccess,
    handleSaveFailure: PersistenceLogic.handleSaveFailure,

    // --- Business Rule Helpers ---

    /**
     * Gets the effective fixed amount for the current session.
     * Priority: 1. Rules from server, 2. Default constant (150).
     */
    getEffectiveAmount: (model: LoteriaFeatureModel): number => {
        const loteriaBetTypeId = model.managementSession.betTypes.loteria;
        const rulesData = model.rules.status.type === 'Success' ? model.rules.status.data : null;
        const validationRules = rulesData?.validation_rules || [];

        const ruleAmount = calculateLoteriaFixedAmount(validationRules, loteriaBetTypeId);

        return ruleAmount !== null ? ruleAmount : DEFAULT_LOTERIA_FIXED_AMOUNT;
    },

    // --- Complex Orchestrations (Inter-module logic) ---

    /**
     * Adds a new bet to the session.
     * Combines: Validation (Input) -> Creation (Session) -> Sync (Session) -> Reset (Session)
     */
    addBet: (model: LoteriaFeatureModel, input: string, amount: number | null = null): { model: LoteriaFeatureModel; newBet: LoteriaBet } | null => {
        if (!InputLogic.isValidBet(input)) return null;

        const newBet = SessionLogic.createBet(input, amount);
        const currentBets = [...model.entrySession.loteria, newBet];

        let updatedModel = SessionLogic.syncState(model, currentBets);

        // Transition to Editing Mode & Clear Input
        updatedModel = {
            ...updatedModel,
            editSession: { ...updatedModel.editSession, currentInput: '' }
        };

        return { model: updatedModel, newBet };
    },

    /**
     * Updates the amount of an existing bet.
     * Combines: Parsing (Input) -> Update (Session) -> Sync (Session) -> Reset (Session)
     */
    submitAmount: (model: LoteriaFeatureModel, amountStr: string): LoteriaFeatureModel | null => {
        const betId = model.loteriaSession.editingBetId;
        if (!betId) return null;

        const amountValue = InputLogic.parseAmount(amountStr);
        const currentBets = model.entrySession.loteria;

        const updatedBets = SessionLogic.updateBetAmount(currentBets, betId, amountValue);

        let updatedModel = SessionLogic.syncState(model, updatedBets);

        // Reset Input after submission
        updatedModel = SessionLogic.resetInput(updatedModel);

        return updatedModel;
    },

    // --- Autonomous Data Handling ---

    /**
     * Updates the model with draw details response.
     */
    updateDrawDetails: (model: LoteriaFeatureModel, response: WebData<DrawType>): LoteriaFeatureModel => ({
        ...model,
        managementSession: {
            ...model.managementSession,
            drawDetails: response
        }
    }),

    /**
     * Updates the model with bet types response.
     * Identifies the specific ID for 'loteria' game type.
     */
    updateBetTypes: (model: LoteriaFeatureModel, response: WebData<GameType[]>): LoteriaFeatureModel => {
        let loteriaId: string | null = null;

        if (response.type === 'Success') {
            const loteriaType = response.data.find((t: GameType) =>
                isLoteriaType(t.name || '', t.id) || t.code === 'CUATERNA'
            );
            if (loteriaType) {
                loteriaId = loteriaType.id;
            }
        }

        return {
            ...model,
            managementSession: {
                ...model.managementSession,
                betTypes: {
                    ...model.managementSession.betTypes,
                    loteria: loteriaId
                }
            }
        };
    },

    /**
     * Updates the model with existing bets response.
     * Syncs the entry session and calculates summaries.
     */
    updateExistingBets: (model: LoteriaFeatureModel, response: WebData<LoteriaBet[]>): LoteriaFeatureModel => {
        let updatedModel = {
            ...model,
            listSession: {
                ...model.listSession,
                remoteData: response.type === 'Success'
                    ? RemoteData.success({ loteria: response.data })
                    : response as any
            }
        };

        if (response.type === 'Success') {
            updatedModel = SessionLogic.syncState(updatedModel, response.data);
        }

        return updatedModel;
    }
};
