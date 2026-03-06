import { LoteriaFeatureModel, ListData } from '../feature.types';
import { LoteriaBet } from '@/types';
import { RemoteData } from '@/shared/core/tea-utils';
import { LoteriaState } from '../../loteria/loteria.types';
import { CalculationLogic } from './calculation.logic';
import { calculateLoteriaFixedAmount, DEFAULT_LOTERIA_FIXED_AMOUNT } from '../../loteria/loteria.domain';

/**
 * 📦 SESSION LOGIC
 * Manages the state of the session (editing, list synchronization).
 * This module is the "Single Source of Truth" enforcer.
 */
export const SessionLogic = {
    /**
     * Creates a new bet object.
     */
    createBet: (input: string, amount: number | null = null): LoteriaBet => ({
        id: CalculationLogic.generateId(),
        bet: input,
        amount
    }),

    /**
     * Updates the amount of a specific bet in a list.
     */
    updateBetAmount: (bets: LoteriaBet[], betId: string, amount: number): LoteriaBet[] => {
        return bets.map(bet => bet.id === betId ? { ...bet, amount } : bet);
    },

    /**
     * 🛡️ CRITICAL: Synchronizes state across all session representations.
     * Ensures Entry (Draft), List (Remote Mirror), and Summary are always consistent.
     */
    syncState: (model: LoteriaFeatureModel, newBets: LoteriaBet[]): LoteriaFeatureModel => {
        // 1. Update Entry Session (Local Draft)
        const nextEntrySession = {
            ...model.entrySession,
            loteria: newBets
        };

        // 2. Update List Session (Remote Mirror) - Only if data is loaded
        const nextListSession = { ...model.listSession };
        if (model.listSession.remoteData.type === 'Success') {
            nextListSession.remoteData = RemoteData.map(
                (data: ListData) => ({ ...data, loteria: newBets }),
                model.listSession.remoteData
            );
        }

        // Calculate fixedAmount to ensure summary is correct (Single Source of Truth)
        const loteriaBetTypeId = model.managementSession.betTypes.loteria;
        const rulesData = model.rules.status.type === 'Success' ? model.rules.status.data : null;
        const validationRules = rulesData?.validation_rules || [];

        // Use rules from server or fallback to the domain default
        const ruleAmount = calculateLoteriaFixedAmount(validationRules, loteriaBetTypeId);
        const fixedAmount = ruleAmount !== null ? ruleAmount : DEFAULT_LOTERIA_FIXED_AMOUNT;

        // 3. Update Summary
        const nextSummary = CalculationLogic.calculateSummary(newBets, model.summary, fixedAmount);

        return {
            ...model,
            entrySession: nextEntrySession,
            listSession: nextListSession,
            summary: nextSummary
        };
    },

    /**
     * Resets the input field in the edit session.
     */
    resetInput: (model: LoteriaFeatureModel): LoteriaFeatureModel => ({
        ...model,
        editSession: { ...model.editSession, currentInput: '' }
    }),

    /**
     * Updates the UI state of the Loteria component (keyboard visibility, etc).
     */
    updateLoteriaSession: (model: LoteriaFeatureModel, session: LoteriaState): LoteriaFeatureModel => ({
        ...model,
        loteriaSession: session
    })
};
