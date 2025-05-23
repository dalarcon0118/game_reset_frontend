import { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useParletStore } from '../store/parlet.store'; // Importar el store
import { ParletBet, FijosCorridosBet } from '@/types'; // Asegurarse que FijosCorridosBet está importado si se usa en promptToAddAsParlet

// Helper to generate random string ID, if needed for new ParletBet
// const generateRandomId = () => Math.random().toString(36).substr(2, 9); // Movido al store

// interface ParletState { // Movido al store
//   isParletModalVisible: boolean;
//   potentialParletNumbers: number[];
//   isParletDrawerVisible: boolean;
//   fromFijosyCorridoBet: boolean; // To track if the flow started from Fijos/Corridos
//   newParletBet: ParletBet | null; // Optional: store the confirmed Parlet bet

//   // Actions
//   openParletDrawer: () => void;
//   promptToAddAsParlet: (fijosCorridosBets: FijosCorridosBet[]) => void;
//   confirmParletBet: () => void;
//   cancelParletBet: () => void;
//   closeParletDrawer: () => void; // Action to close the drawer manually if needed
// }

// const useParletStore = create<ParletState>((set, get) => ({ // Movido al store
//   isParletModalVisible: false,
//   potentialParletNumbers: [],
//   isParletDrawerVisible: false,
//   fromFijosyCorridoBet: false,
//   newParletBet: null, 

//   promptToAddAsParlet: (fijosCorridosBets) => {
//     if (!fijosCorridosBets || fijosCorridosBets.length === 0) {
//         get().openParletDrawer();
//       return;
//     }
//     const extractedNumbers = fijosCorridosBets
//       .map(bet => bet.bet)
//       .filter((value, index, self) => self.indexOf(value) === index); // Unique numbers

//     if (extractedNumbers.length < 2) {
//       Alert.alert("Parlet Bet", "A Parlet bet requires at least two unique numbers.");
//       return;
//     }

//     set({
//       potentialParletNumbers: extractedNumbers,
//       isParletModalVisible: true,
//       fromFijosyCorridoBet: true, // Mark that flow started from Fijos/Corridos
//       isParletDrawerVisible: false, // Ensure drawer is closed when modal opens
//     });
//   },

//   confirmParletBet: () => {
//     const { potentialParletNumbers } = get();
//     if (potentialParletNumbers.length > 0) {
     
//       // Example: Create a new ParletBet object
//        const createdParlet: ParletBet = {
//          id: generateRandomId(),
//          bets: potentialParletNumbers
//        };
//        set({ newParletBet: createdParlet });
//       console.log('Parlet bet confirmed with numbers:', potentialParletNumbers);
//       // Here, you would typically call a function to add `createdParlet` to your list of Parlet bets.
//     }
//     set({
//       isParletModalVisible: false,
//       potentialParletNumbers: [],
//       fromFijosyCorridoBet: false, // Reset flow origin
//     });
//   },

//   cancelParletBet: () => {
//     const wasFromFijos = get().fromFijosyCorridoBet;
//     console.log('Adding Parlet bet cancelled.');
//     set(state => ({
//       isParletModalVisible: false,
//       potentialParletNumbers: [],
//       fromFijosyCorridoBet: false, // Reset flow origin
//       // If cancelled and it was from Fijos/Corridos flow, open the Parlet drawer
//       isParletDrawerVisible: wasFromFijos ? true : state.isParletDrawerVisible,
//     }));
//   },
//   openParletDrawer: () => {
//     set({ isParletDrawerVisible: true });
//   },
//   closeParletDrawer: () => {
//     set({ isParletDrawerVisible: false });
//   }
// }));

/**
 * Custom hook to manage the process of creating a Parlet bet
 * from a list of FijosCorridosBet numbers, using Zustand for state.
 */
export const useParlet = () => {
  // Seleccionar piezas individuales del estado para optimizar re-renders
  const isParletModalVisible = useParletStore(state => state.isParletModalVisible);
  const potentialParletNumbers = useParletStore(state => state.potentialParletNumbers);
  const isParletDrawerVisible = useParletStore(state => state.isParletDrawerVisible);
  const newParletBet = useParletStore(state => state.newParletBet);
  const isAmmountDrawerVisible = useParletStore(state => state.isAmmountDrawerVisible);
  const parletList = useParletStore(state => state.parletList);
  // Obtener acciones usando getState() ya que son estables
  const {
    promptToAddAsParlet,
    confirmParletBet,
    cancelParletBet,
    showParletDrawer,
    showAmmountDrawer,
    processAmountInput,
    processBetInput,
    activateAnnotationType,
    showAmmountKeyboard,
  } = useParletStore.getState();

  // Effect to show the Alert modal when isParletModalVisible and potentialParletNumbers are set
  useEffect(() => {
    console.log("useEffect", isParletDrawerVisible);
    if (isParletModalVisible && potentialParletNumbers.length > 0) {
      Alert.alert(
        "Desea Agregar estos numeros como parlet?",
        `Lista de numeros  [${potentialParletNumbers.join(', ')}] como parlet?`,
        [
          {
            text: "Cancel",
            onPress: cancelParletBet, // Action from Zustand store
            style: "cancel"
          },
          {
            text: "OK",
            onPress: confirmParletBet // Action from Zustand store
          }
        ]
      );
    }
    else {
     //showParletDrawer(true);
    }
  }, [isParletModalVisible, potentialParletNumbers, cancelParletBet, confirmParletBet]);

  return {
    isParletModalVisible,
    potentialParletNumbers,
    isParletDrawerVisible,
    isAmmountDrawerVisible,
    newParletBet,
    parletList,
    // Memoizar las funciones devueltas
    promptToAddAsParlet: useCallback(promptToAddAsParlet, [promptToAddAsParlet]),
    confirmParletBet: useCallback(confirmParletBet, [confirmParletBet]),
    cancelParletBet: useCallback(cancelParletBet, [cancelParletBet]),
    showParletDrawer: useCallback(showParletDrawer, [showParletDrawer]),
    showAmmountDrawer: useCallback(showAmmountDrawer, [showAmmountDrawer]),
    showAmmountKeyboard: useCallback(showAmmountKeyboard, [showAmmountKeyboard]),
    processAmountInput: useCallback(processAmountInput, [processAmountInput]),
    processBetInput: useCallback(processBetInput, [processBetInput]),
    activateAnnotationType :useCallback(activateAnnotationType, [activateAnnotationType]), // Memoizar la función devuelta
    
    
  };
};