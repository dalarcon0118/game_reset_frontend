import { LoteriaFeatureModel, ListData } from '../feature.types';
import { LoteriaBet } from '@/types';
import { RemoteData } from '@core/tea-utils';
import { LoteriaState } from '../../loteria/loteria.types';
import { CalculationLogic } from './calculation.logic';
import { calculateLoteriaFixedAmount, DEFAULT_LOTERIA_FIXED_AMOUNT } from '../../loteria/loteria.domain';
import { resolveLoteriaBetTypeId } from '@/shared/types/bet_types';

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
        const betTypes = model.managementSession.betTypes;
        const loteriaBetTypeId = betTypes.type === 'Success'
            ? resolveLoteriaBetTypeId(betTypes.data)
            : null;

        // 🛡️ Guardia defensiva: RulesModel (bet-workspace) usa rulesList, no status.
        // Se ajusta para usar la estructura real y evitar el crash "Cannot read property 'status' of undefined"
        const rulesList = model.rulesSession?.rulesList;
        const rulesData = rulesList?.type === 'Success' ? rulesList.data : null;
        const validationRules = rulesData?.validationRules || [];

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
