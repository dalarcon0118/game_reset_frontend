import { FinancialSummary } from '@/types';
import { DashboardStats } from '@/features/colector/dashboard/core/model';

export interface BackendFinancialSummary {
  id_estructura: number;
  nombre_estructura: string;
  padre_id: number | null;
  colectado_total: number;
  pagado_total: number;
  neto_total: number;
  sorteos: any[];
}

export interface NodeFinancialSummary {
  structure_id: number;
  date: string;
  total_collected: number;
  total_paid: number;
  total_net: number;
  commissions: number;
  draw_summary: string;
}

export interface BackendDashboardStats {
    date: string;
    stats: DashboardStats;
}

export interface BackendFinancialStatement {
    total_collected: string;
    total_paid: string;
    net_result: string;
    draw: any;
    owner_structure: any;
    date: string;
    level: string;
}

export type { FinancialSummary };
