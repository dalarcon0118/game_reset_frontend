import { FijosCorridosBet, ParletBet } from "@/types";

export interface ParletState {
  // UI State
  isParletDrawerVisible: boolean;
  isParletModalVisible: boolean;
  isAmmountDrawerVisible: boolean;
  parletAlertVisibleState: boolean;

  // Business State
  parletList: ParletBet[];
  activeParletBetId: string;
  potentialParletNumbers: number[];
  fromFijosyCorridoBet: boolean;
  canceledFromFijosyCorridoBet: boolean;
  newParletBet: ParletBet | null;

  // Error State
  isError: boolean;
  errorMessage: string;

  // Annotation State
  activeAnnotationType: string | null;

  // Business Actions
  pressAddParlet: (fijosCorridosBets: FijosCorridosBet[]) => void;
  confirmParletBet: () => void;
  cancelParletBet: () => void;
  processBetInput: (inputString: string) => void;
  processAmountInput: (inputString: string) => void;
  deleteParletBet: (betId: string) => void;
  updateParletBet: (betId: string, changes: Partial<ParletBet>) => void;
  editParletBet: (betId: string) => void;
  setActiveParletBet: (betId: string | null) => void;
  addParletBet: (numbers: number[]) => void;

  // UI Helper Actions
  editAmmountKeyboard: (betId: string) => void;
  activateAnnotationType: (annotationType: string) => void;
  _resetAmountContext: () => void;
  clearError: () => void;
  resetCmd: () => void;
}