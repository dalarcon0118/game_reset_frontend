import { create } from 'zustand';
import { Alert } from 'react-native';
import { FijosCorridosBet, ParletBet } from '@/types';
import { AnnotationTypes } from '@/constants/Bet';
import { splitStringToPairs } from '../../utils/numbers';

// Helper to generate random string ID, if needed for new ParletBet
const generateRandomId = () => Math.random().toString(36).substr(2, 9);

export interface ParletState {
  activeAnnotationType: string | null;
  isParletModalVisible: boolean;
  potentialParletNumbers: number[];
  isParletDrawerVisible: boolean;
  fromFijosyCorridoBet: boolean; // To track if the flow started from Fijos/Corridos
  newParletBet: ParletBet | null; // Optional: store the confirmed Parlet bet
  parletList: ParletBet[];
  isAmmountDrawerVisible: boolean;
  isError: boolean;
  errorMessage: string;
  _resetAmountContext: () => void;

  // Actions
  showParletDrawer: (visible:boolean) => void;
  promptToAddAsParlet: (fijosCorridosBets: FijosCorridosBet[]) => void;
  confirmParletBet: () => void;
  cancelParletBet: () => void;
  showAmmountDrawer: (visible:boolean) => void;
  processAmountInput: (inputString: string) => void;
  processBetInput: (inputString: string) => void;
  activateAnnotationType: (AnnotationType:string) => void;
  showAmmountKeyboard: () => void;
}

export const useParletStore = create<ParletState>((set, get) => ({
  isParletModalVisible: false,
  potentialParletNumbers: [],
  isParletDrawerVisible: false,
  fromFijosyCorridoBet: false,
  newParletBet: null,
  activeAnnotationType: null,
  parletList: [],
  isAmmountDrawerVisible: false,
  isError: false,
  errorMessage: "",
  // Actions
  showAmmountDrawer: (visible:boolean) => {
    console.log('showAmmountDrawer',visible);
    set({ 
      activeAnnotationType: AnnotationTypes.Amount,
      isAmmountDrawerVisible: visible 
    });
  },
  showAmmountKeyboard: ()=>{
    if(get().parletList.length <1){
      Alert.alert("Debes agregar jugadas", "Solo puedes anotar un monto luego de una jugada.");
      return;
    }
    else{
      console.log('showAmmountKeyboard');
      get().showAmmountDrawer(true)
    }
  },

  promptToAddAsParlet: (fijosCorridosBets) => {
    if (!fijosCorridosBets || fijosCorridosBets.length === 0) {
      get().activateAnnotationType(AnnotationTypes.Bet)
      get().showParletDrawer(true)
      return;
    }
    const extractedNumbers = fijosCorridosBets
      .map(bet => bet.bet)
      .filter((value, index, self) => self.indexOf(value) === index); // Unique numbers

    if (extractedNumbers.length < 2) {
      Alert.alert("Apuestas de parlet ", "Los parlet son cifras de dos numeros.");
      return;
    }

    set({
      potentialParletNumbers: extractedNumbers,      
      isParletModalVisible: true,
      
      fromFijosyCorridoBet: true, // Mark that flow started from Fijos/Corridos
      isParletDrawerVisible: false, // Ensure drawer is closed when modal opens
    });
  },

  processBetInput: (inputString: string) => {
    console.log('processBetInput',inputString);
    console.log('activeAnnotationType',get().activeAnnotationType);
    if (get().activeAnnotationType !== AnnotationTypes.Bet) return;

    const pairs = splitStringToPairs(inputString);
    const newBets: ParletBet[] = [];
    const newBetNumbers: number[] = [];

    pairs.forEach((pair) => {
      if (pair.length === 2) {
        const betNumber = parseInt(pair, 10);
        if (!isNaN(betNumber)) {
          newBetNumbers.push(betNumber);
        }
      }
    });
    newBets.push({
      id: generateRandomId(),
      bets: newBetNumbers,
      amount: null
    });
    console.log('newBets',newBets);
    if (newBets.length > 0) {
      set(state => ({
        parletList: [...state.parletList, ...newBets]
      }));
    }
    get().showParletDrawer(false);
  },
  
  processAmountInput: (inputString: string) => {
   
    if (get().activeAnnotationType!== AnnotationTypes.Amount ||  get().parletList.length === 0){
     set({
      isError: true,
      errorMessage: 'No hay apuestas para agregar el monto',
      isAmmountDrawerVisible: true,
      activeAnnotationType: AnnotationTypes.Amount // Set the active annotation type to Amount if needed
     })
      return;
    } 
    const update:ParletBet[] = get().parletList.map((bet)=>{
       bet.amount = parseInt(inputString,10);
       return bet;
    })
    set((state)=>({
      parletList: [...update]
    }))
    get().showAmmountDrawer(false);
  }

  , _resetAmountContext: () => {
    set({
      isAmmountDrawerVisible: false,
      activeAnnotationType: null
    });
  },

  activateAnnotationType: (AnnotationType:string)=>{
    set({ activeAnnotationType: AnnotationType });
  },

  confirmParletBet: () => {
    const { potentialParletNumbers } = get();
    if (potentialParletNumbers.length > 0) {
      const createdParlet: ParletBet = {
        id: generateRandomId(),
        bets: potentialParletNumbers,
        amount: null
      };
      set({ newParletBet: createdParlet });
      console.log('Los nmeros agregados son :', potentialParletNumbers);
    }
    set({
      isParletModalVisible: false,
      potentialParletNumbers: [],
      fromFijosyCorridoBet: false, // Reset flow origin
    });
  },

  cancelParletBet: () => {
    const wasFromFijos = get().fromFijosyCorridoBet;
    console.log('Adding Parlet bet cancelled.');
    set(state => ({
      isParletModalVisible: false,
      potentialParletNumbers: [],
      fromFijosyCorridoBet: false, // Reset flow origin
      isParletDrawerVisible: wasFromFijos ? true : state.isParletDrawerVisible,
    }));
  },
  showParletDrawer: (visible:boolean) => {
    set({ isParletDrawerVisible: visible });
  }
 
}));