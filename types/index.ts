export interface WinningRecord {
  id: number;
  winning_number: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface DrawType {
  id: string;
  name: string; // Nombre del sorteo (ej: Miami, Florida, México)
  description: string | null;
  draw_datetime: string; // ISO datetime string
  betting_start_time: string | null; // ISO datetime string
  betting_end_time: string | null; // ISO datetime string
  status: 'scheduled' | 'completed' | 'cancelled' | 'open' | 'pending' | 'closed';
  draw_type: number; // ID del DrawType
  owner_structure: number; // ID de la estructura (banco)
  winning_numbers: WinningRecord | null;
  created_at: string;
  updated_at: string;
  totalCollected?: number;
  premiumsPaid?: number;
  netResult?: number;

  // Campos calculados para UI (mantener compatibilidad)
  source?: string; // Alias de 'name' para compatibilidad
  date?: string; // Fecha formateada
  time?: string; // Hora formateada
  is_betting_open?: boolean;
  extra_data?: {
    jackpot_amount?: number;
    currency?: string;
    award_date?: string;
    disclaimer?: string;
    [key: string]: any;
  };
}



export interface BetType {
  id: string;
  type: 'Fijo' | 'Parlet' | 'Corrido';
  numbers: string;
  amount: number;
  draw: string;
  createdAt: string;
  isPending?: boolean;
  receiptCode?: string;
}
export type GameType = {
  id: string;
  name: string;
  code: 'FIJO' | 'PARLET' | 'CORRIDO' | 'CENTENA' | 'QUINIELA_DIRECTA' | 'fijo' | 'parlet' | 'corrido' | 'centena' | 'quiniela_directa';
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

export interface LoteriaBet {
  id: string;
  bet: number;
  amount: number | null;
}

export * from "./rules"