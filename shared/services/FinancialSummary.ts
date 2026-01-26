import { FinancialSummary } from '@/types';
import apiClient from '@/shared/services/ApiClient';
import settings from '@/config/settings';
import { to, AsyncResult } from '../utils/generators';
import { DashboardStats } from '@/features/colector/dashboard/core/model';

export interface NodeFinancialSummary {
  structure_id: number;
  date: string;
  total_collected: number;
  total_paid: number;
  total_net: number;
  commissions: number;
  draw_summary: string;
}

// Backend response interface
interface BackendFinancialSummary {
  id_estructura: number;
  nombre_estructura: string;
  padre_id: number | null;
  colectado_total: number;
  pagado_total: number;
  neto_total: number;
  sorteos: any[]; // Detailed draw information
}

export class FinancialSummaryService {
  /**
   * Get financial summary data for the current user's structure
   * @param structureId - Optional structure ID to filter by
   * @returns Promise<AsyncResult<FinancialSummary>>
   */
  static get(structureId?: string | number | null): Promise<AsyncResult<FinancialSummary>> {
    const promise = (async () => {
      let endpoint = settings.api.endpoints.financialStatement(); 

      // Add structure filter if provided
      if (structureId) {
        const separator = endpoint.includes('?') ? '&' : '?';
        endpoint += `${separator}structure_id=${structureId}`;
      }

      const response: BackendFinancialSummary[] = await apiClient.get<BackendFinancialSummary[]>(endpoint, {
        cacheTTL: settings.api.defaults.cacheTTL,
        retryCount: settings.api.defaults.retryCount
      });

      // The API returns an array, but we expect a single summary
      // For dashboard, we take the first result (user's structure)
      const summary = response.length > 0 ? response[0] : {
        id_estructura: 0,
        nombre_estructura: '',
        padre_id: null,
        colectado_total: 0,
        pagado_total: 0,
        neto_total: 0,
        sorteos: []
      };

      // Map backend response to frontend FinancialSummary format
      return {
        totalCollected: summary.colectado_total,
        premiumsPaid: summary.pagado_total,
        netResult: summary.neto_total,
        draws: summary.sorteos,
      };
    })();

    return to(promise);
  }

  /**
   * Get dashboard statistics for a structure
   * @param structureId - ID of the structure
   * @returns Promise<AsyncResult<{ date: string; stats: DashboardStats }>>
   */
  static async getDashboardStats(structureId: string | number): Promise<AsyncResult<{ date: string; stats: DashboardStats }>> {
    const promise = (async () => {
      const endpoint = `${settings.api.endpoints.dashboardStats()}?structure_id=${structureId}`;
      return await apiClient.get<{ date: string; stats: DashboardStats }>(endpoint);
    })();

    return to(promise);
  }

  /**
   * Get financial summary for a specific node
   * @param id - ID of the structure/node
   * @param date - Optional date (YYYY-MM-DD)
   * @returns Promise with node financial summary
   */
  static async getNodeFinancialSummary(id: number, date?: string): Promise<NodeFinancialSummary> {
    try {
      const params = new URLSearchParams();
      params.append('structure_id', id.toString());
      if (date) params.append('date', date);

      const endpoint = `${settings.api.endpoints.financialStatements()}node-summary/?${params.toString()}`;
      return await apiClient.get<NodeFinancialSummary>(endpoint);
    } catch (error) {
      console.error(`Error fetching node financial summary for ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * RESTful list of financial statements with filters
   * @param filters - Filter parameters (draw_id, structure_id, level, date, from, to)
   * @returns Promise with financial statements
   */
  static async list(filters: {
    draw_id?: number | string;
    structure_id?: number | string;
    level?: 'DRAW' | 'STRUCTURE';
    date?: string;
    from?: string;
    to?: string;
  }): Promise<FinancialSummary[]> {
    try {
      const params = new URLSearchParams();
      if (filters.draw_id) params.append('draw_id', filters.draw_id.toString());
      if (filters.structure_id) params.append('structure_id', filters.structure_id.toString());
      if (filters.level) params.append('level', filters.level);
      if (filters.date) params.append('date', filters.date);
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);

      const endpoint = `${settings.api.endpoints.financialStatements()}v2/statements/?${params.toString()}`;
      const response = await apiClient.get<any[]>(endpoint);
      
      // Map RESTful response to frontend FinancialSummary format
      return response.map(item => ({
        totalCollected: parseFloat(item.total_collected),
        premiumsPaid: parseFloat(item.total_paid),
        netResult: parseFloat(item.net_result),
        draw: item.draw,
        owner_structure: item.owner_structure,
        date: item.date,
        level: item.level
      }));
    } catch (error) {
      console.error('Error fetching RESTful financial statements:', error);
      throw error;
    }
  }
}
