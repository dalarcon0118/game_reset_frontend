import { FinancialSummary } from '@/types';
import apiClient from '@/shared/services/ApiClient';
import settings from '@/config/settings';
import { to, AsyncResult } from '../utils/generators';

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

      const response: BackendFinancialSummary[] = await apiClient.get<BackendFinancialSummary[]>(endpoint);

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
}
