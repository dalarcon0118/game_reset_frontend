export interface DrawType {
  id: string;
  source: string;
  date: string;
  time: string;
  status: 'open' | 'pending' | 'closed';
}



export interface BetType {
  id: string;
  type: 'Fijo' | 'Parlet' | 'Corrido';
  numbers: string;
  amount: number;
  draw: string;
  createdAt: string;
}
export type GameType = {
  id: string;
  name: string;
  code: 'fijo' | 'parlet' | 'centena';
  description: string;
};

export interface FinancialSummary {
  totalCollected: number;
  premiumsPaid: number;
  netResult: number;
}

export interface FijosCorridosBet {
  id: string; // Changed to string
  bet: number;
  fijoAmount: number | null; // Allow null for empty state
  corridoAmount: number | null; // Allow null for empty state
}


export interface ParletBet {
  id: string;
  bets: number[];
  amount?: number | null;
}

export interface CentenaBet {
  id: string;
  bet: number;
  amount: number;
}
export * from "./rules"