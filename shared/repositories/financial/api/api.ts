import settings from '@/config/settings';
import {
    BackendFinancialSummary,
    NodeFinancialSummary,
    BackendDashboardStats,
    BackendFinancialStatement
} from './types';
import {
    BackendFinancialSummaryCodec,
    NodeFinancialSummaryCodec,
    BackendDashboardStatsCodec,
    BackendFinancialStatementArrayCodec,
    decodeOrFallback
} from './codecs';
import { logger } from '@/shared/utils/logger';
import apiClient from '@/shared/services/api_client';

const log = logger.withTag('FINANCIAL_SUMMARY_API');

export const FinancialSummaryApi = {
    getSummary: async (structureId: string | number, date: string): Promise<BackendFinancialSummary> => {
        const endpoint = `${settings.api.endpoints.financialStatement()}?structure_id=${structureId}&date=${date}`;
        const response = await apiClient.get<any>(endpoint);

        let data: any;
        if (Array.isArray(response)) {
            data = response.length > 0 ? response[0] : null;
        } else {
            data = response;
        }

        if (!data) {
            log.warn('API returned null/undefined summary data');
            return {
                id_estructura: 0,
                nombre_estructura: '',
                padre_id: null,
                colectado_total: 0,
                pagado_total: 0,
                neto_total: 0,
                sorteos: []
            };
        }

        log.debug('Decoding financial summary', { data });
        return decodeOrFallback(BackendFinancialSummaryCodec, data, 'getSummary');
    },

    getDashboardStats: async (structureId: string | number): Promise<BackendDashboardStats> => {
        const endpoint = `${settings.api.endpoints.dashboardStats()}?structure_id=${structureId}`;
        const response = await apiClient.get<BackendDashboardStats>(endpoint);
        return decodeOrFallback(BackendDashboardStatsCodec, response, 'getDashboardStats') as BackendDashboardStats;
    },

    getNodeSummary: async (id: number, date?: string): Promise<NodeFinancialSummary> => {
        const params = new URLSearchParams();
        params.append('structure_id', id.toString());
        if (date) params.append('date', date);

        const endpoint = `${settings.api.endpoints.financialStatements()}node-summary/?${params.toString()}`;
        const response = await apiClient.get<NodeFinancialSummary>(endpoint, {
            cacheTTL: 0,
            retryCount: settings.api.defaults.retryCount
        });
        return decodeOrFallback(NodeFinancialSummaryCodec, response, 'getNodeSummary');
    },

    listStatements: async (filters: any): Promise<BackendFinancialStatement[]> => {
        const params = new URLSearchParams();
        if (filters.draw_id) params.append('draw_id', filters.draw_id.toString());
        if (filters.structure_id) params.append('structure_id', filters.structure_id.toString());
        if (filters.level) params.append('level', filters.level);
        if (filters.date) params.append('date', filters.date);
        if (filters.from) params.append('from', filters.from);
        if (filters.to) params.append('to', filters.to);

        const endpoint = `${settings.api.endpoints.financialStatements()}v2/statements/?${params.toString()}`;
        const response = await apiClient.get<BackendFinancialStatement[]>(endpoint, {
            cacheTTL: 0,
            retryCount: settings.api.defaults.retryCount
        });
        return decodeOrFallback(BackendFinancialStatementArrayCodec, response, 'listStatements');
    }
};
