import { FinancialSummary } from '@/types';
import { to, AsyncResult } from '../utils/generators';
import { DashboardStats } from '@/features/colector/dashboard/core/model';
import { OfflineStorage } from './offline_storage';
import { FinancialSummaryApi } from './financial_summary/api';
import { NodeFinancialSummary } from './financial_summary/types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('FINANCIAL_SUMMARY_SERVICE');

export type { NodeFinancialSummary };

export class FinancialSummaryService {
  /**
   * Get financial summary for dashboard
   * @param structureId - ID of the structure
   * @param date - Optional date filter (YYYY-MM-DD). Defaults to today.
   * @returns Promise<AsyncResult<FinancialSummary>>
   */
  static async get(structureId: string | number, date?: string): Promise<AsyncResult<FinancialSummary>> {
    const promise = (async () => {
      const targetDate = date || new Date().toISOString().split('T')[0];

      try {
        const summary = await FinancialSummaryApi.getSummary(structureId, targetDate);
        // Save to cache on success
        OfflineStorage.saveLastSummary(summary);

        return {
          totalCollected: summary.colectado_total || 0,
          premiumsPaid: summary.pagado_total || 0,
          netResult: summary.neto_total || 0,
          draws: summary.sorteos || [],
        };
      } catch (error: any) {
        log.warn('Network error or rate limit, falling back to offline cache', error);

        const cached = await OfflineStorage.getLastSummary();
        if (cached) {
          log.debug('Successfully loaded summary from offline storage');
          return {
            totalCollected: cached.colectado_total || 0,
            premiumsPaid: cached.pagado_total || 0,
            netResult: cached.neto_total || 0,
            draws: cached.sorteos || [],
          };
        } else {
          throw error;
        }
      }
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
      const response = await FinancialSummaryApi.getDashboardStats(structureId);
      return response as { date: string; stats: DashboardStats };
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
      return await FinancialSummaryApi.getNodeSummary(id, date);
    } catch (error) {
      log.error(`Error fetching node financial summary for ID ${id}`, error);
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
      const response = await FinancialSummaryApi.listStatements(filters);

      // Map RESTful response to frontend FinancialSummary format
      return response.map(item => ({
        totalCollected: parseFloat(item.total_collected),
        premiumsPaid: parseFloat(item.total_paid),
        netResult: parseFloat(item.net_result),
        draw: item.draw,
        owner_structure: item.owner_structure,
        date: item.date,
        level: item.level as any
      }));
    } catch (error) {
      log.error('Error fetching RESTful financial statements', error);
      throw error;
    }
  }
}
