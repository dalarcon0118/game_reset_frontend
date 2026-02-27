// Modelos de dominio puros - Sin dependencias externas
// Representan las entidades del negocio

export interface FinancialSummary {
  totalCollected: number;
  premiumsPaid: number;
  estimatedCommission: number;
  timestamp: number;
}

export interface PendingBet {
  id: string;
  amount: number;
  timestamp: number;
  status: 'pending' | 'resolved';
}

export interface UserProfile {
  id: string;
  name: string;
  structureId: string;
  commissionRate: number; // 0-1
}

export interface UserPreferences {
  showBalance: boolean;
  theme?: string;
}

// Value Objects
export interface DailyTotals {
  totalCollected: number;
  premiumsPaid: number;
  netResult: number;
  estimatedCommission: number;
  amountToRemit: number;
}

export interface TimeRange {
  start: number;
  end: number;
}