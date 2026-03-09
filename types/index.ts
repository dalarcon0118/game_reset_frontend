export interface WinningRecord {
  id: number;
  winning_number: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export const DRAW_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  OPEN: 'open',
  PENDING: 'pending',
  CLOSED: 'closed',
  REWARDED: 'rewarded',
} as const;

export type DrawStatus = typeof DRAW_STATUS[keyof typeof DRAW_STATUS];

export interface DrawType {
  id: string;
  name: string; // Nombre del sorteo (ej: Miami, Florida, México)
  description: string | null;
  draw_datetime: string; // ISO datetime string
  betting_start_time: string | null; // ISO datetime string
  betting_end_time: string | null; // ISO datetime string
  status: DrawStatus;
  draw_type: number; // ID del DrawType
  owner_structure: number; // ID de la estructura (banco)
  winning_numbers: WinningRecord | null;
  created_at: string;
  updated_at: string;
  totalCollected?: number;
  premiumsPaid?: number;
  netResult?: number;

  draw_type_details?: {
    id: number;
    name: string;
    description: string | null;
    code: string;
  };

  // Campos calculados para UI (mantener compatibilidad)
  source?: string; // Alias de 'name' para compatibilidad
  date?: string; // Fecha formateada
  time?: string; // Hora formateada
  is_betting_open?: boolean;
  is_rewarded?: boolean;
  extra_data?: {
    jackpot_amount?: number;
    currency?: string;
    award_date?: string;
    disclaimer?: string;
    [key: string]: any;
  };
  _offline?: {
    pendingCount: number;
    localAmount: number;
    backendAmount: number;
    hasDiscrepancy: boolean;
  };
}



export interface BetType {
  id: string; // Backend serial ID
  externalId: string; // Frontend UUID
  type: string; // Friendly name of the type
  numbers: any; // JSONField compatible
  amount: number; // Flat amount
  drawId: string | number;
  betTypeId: string | number;
  status: 'pending' | 'synced' | 'error' | 'blocked';
  timestamp: number;
  createdAt: string; // ISO format for UI
  receiptCode?: string;
  ownerStructure?: string | number;
  isPending?: boolean; // Legacy flag for UI compatibility
  lastError?: string;
  retryCount?: number;
}
export type GameType = {
  id: string;
  name: string;
  code: string;
  description: string;
};

export interface FinancialSummary {
  totalCollected: number;
  premiumsPaid: number;
  netResult: number;
  draws?: DrawFinancialInfo[];
  timestamp?: number;
  date?: string;
  id_estructura?: number;
  nombre_estructura?: string;
  padre_id?: number | null;
  colectado_total?: number;
  pagado_total?: number;
  neto_total?: number;
  sorteos?: DrawFinancialInfo[];
}

export interface DrawFinancialInfo {
  id_sorteo: number;
  nombre_sorteo: string;
  numero_ganador: string;
  colectado: number;
  pagado: number;
  neto: number;
}

export interface FijosCorridosBet {
  id: string; // Changed to string
  bet: number;
  fijoAmount: number | null; // Allow null for empty state
  corridoAmount: number | null; // Allow null for empty state
  receiptCode?: string;
  betTypeid?: string | number;
  drawid?: string | number;
  usedInParlet?: boolean;
}


export interface ParletBet {
  id: string;
  bets: number[];
  amount?: number | null;
  receiptCode?: string;
  betTypeid?: string | number;
  drawid?: string | number;
}

export interface CentenaBet {
  id: string;
  bet: number;
  amount: number;
  receiptCode?: string;
  betTypeid?: string | number;
  drawid?: string | number;
}

export interface LoteriaBet {
  id: string;
  bet: string;
  amount: number | null;
  receiptCode?: string;
  betTypeid?: string | number;
  drawid?: string | number;
}

export * from "./rules"