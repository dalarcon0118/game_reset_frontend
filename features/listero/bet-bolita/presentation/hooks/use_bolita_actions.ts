import { useCallback } from 'react';
import { useBolitaDispatch } from '../store';
import { 
    FIJOS, 
    PARLET, 
    CENTENA, 
    FijosMessages, 
    ParletMessages, 
    CentenaMessages 
} from '../../domain/models/bolita.messages';
import { FijosCorridosBet } from '@/types';

/**
 * 🛠️ USE BOLITA ACTIONS
 * 
 * Hook centralizado para las acciones de interacción de Bolita.
 * Provee una interfaz unificada para abrir teclados y gestionar flujos.
 * Cumple con SRP al separar las acciones de la visualización de datos.
 */
export const useBolitaActions = () => {
    const dispatch = useBolitaDispatch();

    // --- Fijos Actions ---
    const openFijosBetKeyboard = useCallback(() => 
        dispatch(FIJOS(FijosMessages.OPEN_BET_KEYBOARD())), [dispatch]);

    const openFijosAmountKeyboard = useCallback((betId: string, amountType: 'fijo' | 'corrido') =>
        dispatch(FIJOS(FijosMessages.OPEN_AMOUNT_KEYBOARD({ betId, amountType }))), [dispatch]);

    // --- Parlet Actions ---
    const openParletBetKeyboard = useCallback((fijosCorridosList: FijosCorridosBet[]) => 
        dispatch(PARLET(ParletMessages.PRESS_ADD_PARLET({ fijosCorridosList }))), [dispatch]);

    const editParletBet = useCallback((betId: string) => 
        dispatch(PARLET(ParletMessages.EDIT_PARLET_BET({ betId }))), [dispatch]);

    const openParletAmountKeyboard = useCallback((betId: string) => 
        dispatch(PARLET(ParletMessages.OPEN_PARLET_AMOUNT_KEYBOARD({ betId }))), [dispatch]);

    // --- Centena Actions ---
    const openCentenaBetKeyboard = useCallback(() => 
        dispatch(CENTENA(CentenaMessages.PRESS_ADD_CENTENA())), [dispatch]);

    const editCentenaBet = useCallback((betId: string) => 
        dispatch(CENTENA(CentenaMessages.EDIT_CENTENA_BET({ betId }))), [dispatch]);

    const openCentenaAmountKeyboard = useCallback((betId: string) => 
        dispatch(CENTENA(CentenaMessages.OPEN_CENTENA_AMOUNT_KEYBOARD({ betId }))), [dispatch]);

    return {
        fijos: {
            openBetKeyboard: openFijosBetKeyboard,
            openAmountKeyboard: openFijosAmountKeyboard,
        },
        parlet: {
            openBetKeyboard: openParletBetKeyboard,
            editBet: editParletBet,
            openAmountKeyboard: openParletAmountKeyboard,
        },
        centena: {
            openBetKeyboard: openCentenaBetKeyboard,
            editBet: editCentenaBet,
            openAmountKeyboard: openCentenaAmountKeyboard,
        }
    };
};
