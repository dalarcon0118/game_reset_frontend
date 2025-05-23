import { create } from 'zustand';
import { FijosCorridosBet } from '@/types';
import { GameTypes, AnnotationType, AnnotationTypes, GameTypeCodes } from '@/constants/Bet';
import { splitStringToPairs } from '../../utils/numbers';

// Funciones auxiliares (movidas aquí ya que son usadas por el store)
const generateRandomId = () => Math.random().toString(36).substr(2, 9);



export interface FijosParletState {
  showBetKeyboard: boolean;
  showAmountKeyboard: boolean;
  fijosCorridosList: FijosCorridosBet[];
  betBuffer: number[];
  activeAnnotationType: AnnotationType | null;
  activeGameType: GameTypeCodes | null;
  editingBetId: string | null;
  editingAmountType: 'fijo' | 'corrido' | null;
  amountConfirmationDetails: {
    amountValue: number;
    intendedAmountType: 'fijo' | 'corrido';
    intendedBetId: string | null;
  } | null;

  // Acciones
  handleAddBetPress: () => void;
  handleAmountCirclePress: (betId: string, amountType: 'fijo' | 'corrido') => void;
  processBetInput: (inputString: string) => void;
  submitAmountInput: (amountString: string) => void;
  confirmApplyAmountToAllBuffered: () => void;
  confirmApplyAmountToSingle: () => void;
  cancelAmountConfirmation: () => void;
  hideBetKeyboard: () => void;
  hideAmountKeyboard: () => void;
  _applyAmountToSingleBet: (betId: string, amountType: 'fijo' | 'corrido', amount: number) => void;
  _applyAmountToBufferedBets: (amountType: 'fijo' | 'corrido', amount: number) => void;
  _resetAmountContext: () => void;
}

export const useFijosParletStore = create<FijosParletState>((set, get) => ({
  showBetKeyboard: false,
  showAmountKeyboard: false,
  fijosCorridosList: [],
  betBuffer: [],
  activeAnnotationType: null,
  activeGameType: null,
  editingBetId: null,
  editingAmountType: null,
  amountConfirmationDetails: null,

  handleAddBetPress: () => {
    set({
      activeAnnotationType: AnnotationTypes.Bet,
      activeGameType: GameTypes.FIJOS_CORRIDOS,
      showBetKeyboard: true,
      showAmountKeyboard: false,
      editingBetId: null,
      editingAmountType: null,
      amountConfirmationDetails: null,
    });
  },

  handleAmountCirclePress: (betId, amountType) => {
    console.log(`Editing amount for bet ${betId}, type: ${amountType}`);
    set({
      editingBetId: betId,
      editingAmountType: amountType,
      activeAnnotationType: AnnotationTypes.Amount,
      activeGameType: GameTypes.FIJOS_CORRIDOS,
      showAmountKeyboard: true,
      showBetKeyboard: false,
      amountConfirmationDetails: null,
    });
  },

  processBetInput: (inputString) => {
    if (get().activeAnnotationType !== AnnotationTypes.Bet || get().activeGameType !== GameTypes.FIJOS_CORRIDOS) return;

    const pairs = splitStringToPairs(inputString);
    const newBets: FijosCorridosBet[] = [];
    const newBetNumbers: number[] = [];

    pairs.forEach((pair) => {
      if (pair.length === 2) {
        const betNumber = parseInt(pair, 10);
        if (!isNaN(betNumber)) {
          newBets.push({
            id: generateRandomId(),
            bet: betNumber,
            fijoAmount: null,
            corridoAmount: null,
          });
          newBetNumbers.push(betNumber);
        }
      }
    });

    if (newBets.length > 0) {
      set(state => ({
        fijosCorridosList: [...state.fijosCorridosList, ...newBets],
        betBuffer: [...state.betBuffer, ...newBetNumbers],
      }));
    }
    get().hideBetKeyboard();
  },
  
  _resetAmountContext: () => {
    set({
      showAmountKeyboard: false,
      editingBetId: null,
      editingAmountType: null,
      activeAnnotationType: null,
      amountConfirmationDetails: null,
    });
  },

  submitAmountInput: (amountString) => {
    const { activeAnnotationType, editingAmountType, editingBetId, betBuffer, fijosCorridosList } = get();
    if (activeAnnotationType !== AnnotationTypes.Amount || !editingAmountType || amountString === '') {
      get()._resetAmountContext();
      return;
    }

    const amountValue = parseInt(amountString, 10);
    if (isNaN(amountValue)) {
      get()._resetAmountContext();
      return; 
    }
    
    const editingBetObject = fijosCorridosList.find(b => b.id === editingBetId);

    if (betBuffer.length > 1 && editingBetId && editingBetObject && betBuffer.includes(editingBetObject.bet)) {
      set({
        amountConfirmationDetails: {
          amountValue,
          intendedAmountType: editingAmountType,
          intendedBetId: editingBetId,
        },
        showAmountKeyboard: false,
      });
    } else {
      if (editingBetId) {
        get()._applyAmountToSingleBet(editingBetId, editingAmountType, amountValue);
      }
      get()._resetAmountContext();
    }
  },

  confirmApplyAmountToAllBuffered: () => {
    const { amountConfirmationDetails } = get();
    if (!amountConfirmationDetails) return;
    get()._applyAmountToBufferedBets(amountConfirmationDetails.intendedAmountType, amountConfirmationDetails.amountValue);
    get()._resetAmountContext();
    //set({ betBuffer: [] });
  },

  confirmApplyAmountToSingle: () => {
    const { amountConfirmationDetails } = get();
    if (!amountConfirmationDetails || !amountConfirmationDetails.intendedBetId) return;
    get()._applyAmountToSingleBet(
      amountConfirmationDetails.intendedBetId,
      amountConfirmationDetails.intendedAmountType,
      amountConfirmationDetails.amountValue
    );
    get()._resetAmountContext();
  },
  
  cancelAmountConfirmation: () => {
    get()._resetAmountContext();
  },

  hideBetKeyboard: () => {
    set({ showBetKeyboard: false });
  },

  hideAmountKeyboard: () => {
    set({ showAmountKeyboard: false, editingBetId: null, editingAmountType: null });
  },

  _applyAmountToSingleBet: (betId, amountType, amount) => {
    set(state => ({
      fijosCorridosList: state.fijosCorridosList.map(bet =>
        bet.id === betId
          ? { ...bet, [amountType === 'fijo' ? 'fijoAmount' : 'corridoAmount']: amount }
          : bet
      ),
    }));
  },

  _applyAmountToBufferedBets: (amountType, amount) => {
    set(state => ({
      fijosCorridosList: state.fijosCorridosList.map(bet =>
        state.betBuffer.includes(bet.bet)
          ? { ...bet, [amountType === 'fijo' ? 'fijoAmount' : 'corridoAmount']: amount }
          : bet
      ),
    }));
  },
}));