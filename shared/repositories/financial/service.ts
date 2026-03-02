import { FinancialSummary } from '@/types';
import { DashboardStats } from '@/features/colector/dashboard/core/model';
import { OfflineFirstSummaryRepository } from './summary.repository';
import { FinancialSummaryApi } from './api/api';
import { NodeFinancialSummary } from './api/types';
import { logger } from '@/shared/utils/logger';
import { retry } from '@/shared/utils/retry';
import { Result, ok, err } from 'neverthrow';

const log = logger.withTag('FINANCIAL_SUMMARY_SERVICE');

export class FinancialSummaryService {
  /**
   * Get financial summary for dashboard
   * @param structureId - ID of the structure
   * @param date - Optional date filter (YYYY-MM-DD). Defaults to today.
   * @returns Promise<Result<FinancialSummary, Error>>
   */
  static async get(structureId: string | number, date?: string): Promise<Result<FinancialSummary, Error>> {
    // Validación de parámetros
    if (!structureId || (typeof structureId !== 'string' && typeof structureId !== 'number')) {
      return err(new Error('Invalid structureId: must be string or number'));
    }

    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return err(new Error('Invalid date format: must be YYYY-MM-DD'));
    }

    const startTime = Date.now();
    const repository = new OfflineFirstSummaryRepository();

    const retryResult = await retry(async () => {
      const result = await repository.getSummary(structureId, date);

      if (result.isErr()) {
        log.error('Repository failed to get summary', {
          structureId,
          date,
          error: result.error.message,
          duration: Date.now() - startTime
        });
        throw result.error;
      }

      return result.value;
    });

    if (!retryResult.success) {
      return err(retryResult.error);
    }

    log.info('Summary retrieved successfully', {
      structureId,
      date,
      hasDraws: retryResult.data.draws && retryResult.data.draws.length > 0,
      duration: Date.now() - startTime,
      attempts: retryResult.attempts
    });

    return ok(retryResult.data);
  }

  /**
   * Get dashboard statistics for a structure
   * @param structureId - ID of the structure
   * @returns Promise<Result<{ date: string; stats: DashboardStats }, Error>>
   */
  static async getDashboardStats(structureId: string | number): Promise<Result<{ date: string; stats: DashboardStats }, Error>> {
    try {
      const response = await FinancialSummaryApi.getDashboardStats(structureId);
      return ok(response as { date: string; stats: DashboardStats });
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get financial summary for a specific node
   * @param id - ID of the structure/node
   * @param date - Optional date (YYYY-MM-DD)
   * @returns Promise<Result<NodeFinancialSummary, Error>>
   */
  static async getNodeFinancialSummary(id: number, date?: string): Promise<Result<NodeFinancialSummary, Error>> {
    const retryResult = await retry(async () => {
      return await FinancialSummaryApi.getNodeSummary(id, date);
    });

    if (!retryResult.success) {
      log.error(`Error fetching node financial summary for ID ${id}`, retryResult.error);
      return err(retryResult.error);
    }

    return ok(retryResult.data);
  }

  /**
   * RESTful list of financial statements with filters
   * @param filters - Filter parameters (draw_id, structure_id, level, date, from, to)
   * @returns Promise<Result<FinancialSummary[], Error>>
   */
  static async list(filters: {
    draw_id?: number | string;
    structure_id?: number | string;
    level?: 'DRAW' | 'STRUCTURE';
    date?: string;
    from?: string;
    to?: string;
  }): Promise<Result<FinancialSummary[], Error>> {
    try {
      const response = await FinancialSummaryApi.listStatements(filters);

      // Map RESTful response to frontend FinancialSummary format
      const data = response.map(item => ({
        totalCollected: parseFloat(item.total_collected),
        premiumsPaid: parseFloat(item.total_paid),
        netResult: parseFloat(item.net_result),
        draw: item.draw,
        owner_structure: item.owner_structure,
        date: item.date,
        level: item.level as any
      }));
      return ok(data);
    } catch (error) {
      log.error('Error fetching RESTful financial statements', error);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
