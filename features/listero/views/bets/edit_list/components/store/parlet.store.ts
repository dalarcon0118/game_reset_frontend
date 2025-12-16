import { create } from 'zustand';
import { FijosCorridosBet, ParletBet } from '@/types';
import { AnnotationTypes } from '@/constants/Bet';
import { ParletState } from './IParlet.store';
import { extractUniqueNumbers, parseInputToBetNumbers } from '../domain/ParletTransform';
import { validateParletNumbers, validateAmount } from '../domain/ParletValidation';
import { createBet, editBetById, findBet, deleteBet } from '../domain/BetDomain';
import { Edit } from 'lucide-react-native';

export const Cmd = {
  None: "None",
  Add: "Add",
  Added: "Added",
  Edit: "Edit",
  Edited: "Edited",
  Process: "Process",
}

export const useParletStore = create<ParletState & {
  cmd: string;
}>((set, get) => {
  return {
    // Business State
    parletList: [],
    activeParletBetId: '',
    potentialParletNumbers: [],
    fromFijosyCorridoBet: false,
    canceledFromFijosyCorridoBet: false,
    newParletBet: null,

    // Error State
    isError: false,
    errorMessage: '',
    cmd: Cmd.None,

    // Annotation State
    activeAnnotationType: null as string | null,


    // Actions - Business Logic
    pressAddParlet: (fijosCorridosBets: FijosCorridosBet[]) => {
      const state = get();

      /*if (!numbersValidation.ok) {
        const msg = numbersValidation.errorCode === 'PARLET_MIN_NUMBERS'
          ? 'Los parlet son cifras de dos numeros.'
          : 'Error en los números del parlet.';

        set({ isError: true, errorMessage: msg });
        return;
      }*/
      console.log("pasa por la funcion pressAddParlet");

      set({
        cmd: Cmd.Add,
        potentialParletNumbers: fijosCorridosBets?.length > 0 ? extractUniqueNumbers(fijosCorridosBets) : [],
        fromFijosyCorridoBet: (fijosCorridosBets?.length > 0),
        activeAnnotationType: AnnotationTypes.Bet,
        activeParletBetId: '',
        isError: false,
        errorMessage: ''
      });
    },

    processBetInput: (inputString: string) => {
      const newBetNumbers = parseInputToBetNumbers(inputString);
      const activeBetId = get().activeParletBetId;

      if (activeBetId) {
        if (newBetNumbers.length > 0) {
          const updated = editBetById(get().parletList, activeBetId, { bets: newBetNumbers });
          set({ parletList: updated });
        }
      } else {
        if (newBetNumbers.length > 0) {
          const created = createBet(newBetNumbers, null);
          set(state => ({
            parletList: [...state.parletList, created],
            activeParletBetId: ''
          }));
        }
      }
      set({ cmd: Cmd.Added });
    },

    processAmountInput: (inputString: string) => {
      const hasBets = get().parletList.length > 0;
      if (!hasBets) {
        set({
          isError: true,
          errorMessage: 'No hay apuestas para agregar el monto',
          isAmmountDrawerVisible: true,
          activeAnnotationType: AnnotationTypes.Amount
        });
        return;
      }

      const activeBetId = get().activeParletBetId;
      const amountValidation = validateAmount(inputString);
      if (!amountValidation.ok || amountValidation.value === undefined) {
        set({ isError: true, errorMessage: 'Monto inválido' });
        return;
      }

      const updated = editBetById(get().parletList, activeBetId, { amount: amountValidation.value });
      set({
        parletList: updated,
        activeParletBetId: '',
        cmd: Cmd.Edited,
      });
    },

    confirmParletBet: () => {
      const state = get();
      if (state.potentialParletNumbers.length > 0) {
        const created = createBet(state.potentialParletNumbers, null);
        set({
          parletList: [...state.parletList, created],
          newParletBet: null,
          activeParletBetId: created.id,
          parletAlertVisibleState: false,
          potentialParletNumbers: [],
          fromFijosyCorridoBet: false,
          canceledFromFijosyCorridoBet: false,
        });
      }
    },

    cancelParletBet: () => {
      set({
        parletAlertVisibleState: false,
        potentialParletNumbers: [],
        canceledFromFijosyCorridoBet: true,
        fromFijosyCorridoBet: false,
      });
    },

    setActiveParletBet: (betId: string | null) => {
      console.log("setActiveParletBet", get().activeParletBetId);
      set({ activeParletBetId: betId || '' });
    },

    editParletBet: (betId: string) => {
      const targetBet = findBet(get().parletList, betId);
      if (targetBet) {
        set({
          potentialParletNumbers: [...targetBet.bets],
          activeParletBetId: betId,
          activeAnnotationType: AnnotationTypes.Bet,
          cmd: Cmd.Edit,
        });
      } else {
        set({ isError: true, errorMessage: 'Apuesta no encontrada' });
      }
    },

    deleteParletBet: (betId: string) => {
      const state = get();
      const updated = deleteBet(state.parletList, betId);
      const activeBetId = state.activeParletBetId;
      set({
        parletList: updated,
        activeParletBetId: activeBetId === betId ? '' : activeBetId
      });
    },

    updateParletBet: (betId: string, changes: Partial<ParletBet>) => {
      const updated = editBetById(get().parletList, betId, changes);
      set({ parletList: updated });
    },

    addParletBet: (numbers: number[]) => {
      if (!numbers || numbers.length === 0) return;
      const created = createBet(numbers, null);
      set(state => ({
        parletList: [...state.parletList, created],
        activeParletBetId: created.id
      }));
    },

    _resetAmountContext: () => {
      set({ isAmmountDrawerVisible: false });
    },

    activateAnnotationType: (annotationType: string) => {
      set({ activeAnnotationType: annotationType });
    },

    clearError: () => {
      set({ isError: false, errorMessage: '' });
    },

    resetCmd: () => {
      set({ cmd: Cmd.None });
    },

    editAmmountKeyboard: (betId: string) => {
      const state = get();
      const targetBet = findBet(get().parletList, betId);

      if (state.parletList.length < 1) {
        set({ isError: true, errorMessage: 'Debes agregar jugadas. Solo puedes anotar un monto luego de una jugada.' });
        return;
      }

      if (targetBet) {
        set({
          activeParletBetId: betId,
          activeAnnotationType: AnnotationTypes.Amount,
          cmd: Cmd.Edit,
        });
      }

    },
  };
});