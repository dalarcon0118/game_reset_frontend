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

/**
 * Contexto que el host (Dashboard) pasa al plugin.
 * Basado en la definición de PluginContext en shared/core/plugins/plugin.types.ts
 */
export interface SummaryPluginContext {
  hostStore: any;
  state: {
    userStructureId?: string;
    commissionRate?: number;
    [key: string]: any;
  };
  storage: {
    getItem: (key: string) => Promise<any>;
    setItem: (key: string, value: any) => Promise<void>;
  };
  api: any;
  events: any;
}