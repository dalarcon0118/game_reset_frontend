import { ParletBet } from '@/types';

const generateRandomId = () => Math.random().toString(36).slice(2, 11);

export function createBet(bets: number[], amount: number | null = null): ParletBet {
  return { id: generateRandomId(), bets, amount };
}

export function editBet(bet: ParletBet, changes: Partial<ParletBet>): ParletBet {
  return { ...bet, ...changes };
}

export function findBet(list: ParletBet[], betId: string): ParletBet | undefined {
  return list.find(b => b.id === betId);
}

export function deleteBet(list: ParletBet[], betId: string): ParletBet[] {
  return list.filter(b => b.id !== betId);
}

export function editBetById(list: ParletBet[], betId: string, changes: Partial<ParletBet>): ParletBet[] {
  return list.map(b => (b.id === betId ? { ...b, ...changes } : b));
}