import { ParletBet } from '@/types';
import { createBet, editBetById, deleteBet } from './BetDomain';

export interface ParletBusinessState {
  parletList: ParletBet[];
  activeParletBetId: string;
  potentialParletNumbers: number[];
  fromFijosyCorridoBet: boolean;
  canceledFromFijosyCorridoBet: boolean;
  newParletBet: ParletBet | null;
}

export const createInitialParletBusinessState = (): ParletBusinessState => ({
  parletList: [],
  activeParletBetId: '',
  potentialParletNumbers: [],
  fromFijosyCorridoBet: false,
  canceledFromFijosyCorridoBet: false,
  newParletBet: null,
});

export class ParletBusinessService {
  private state: ParletBusinessState;
  private setState: (newState: Partial<ParletBusinessState>) => void;

  constructor(initialState: ParletBusinessState, setState: (newState: Partial<ParletBusinessState>) => void) {
    this.state = initialState;
    this.setState = setState;
  }

  addParletBet(numbers: number[]): void {
    if (!numbers || numbers.length === 0) return;
    const created = createBet(numbers, null);
    this.setState({
      parletList: [...this.state.parletList, created],
      activeParletBetId: created.id
    });
  }

  updateParletBet(betId: string, changes: Partial<ParletBet>): void {
    const updated = editBetById(this.state.parletList, betId, changes);
    this.setState({ parletList: updated });
  }

  deleteParletBet(betId: string): void {
    const updated = deleteBet(this.state.parletList, betId);
    const activeBetId = this.state.activeParletBetId;
    this.setState({
      parletList: updated,
      activeParletBetId: activeBetId === betId ? '' : activeBetId
    });
  }

  setActiveParletBet(betId: string | null): void {
    this.setState({ activeParletBetId: betId || '' });
  }

  setPotentialParletNumbers(numbers: number[]): void {
    this.setState({ potentialParletNumbers: numbers });
  }

  setFromFijosyCorridoBet(value: boolean): void {
    this.setState({ fromFijosyCorridoBet: value });
  }

  setCanceledFromFijosyCorridoBet(value: boolean): void {
    this.setState({ canceledFromFijosyCorridoBet: value });
  }

  setNewParletBet(bet: ParletBet | null): void {
    this.setState({ newParletBet: bet });
  }

  clearPotentialNumbers(): void {
    this.setState({ potentialParletNumbers: [] });
  }

  getState(): ParletBusinessState {
    return this.state;
  }
}