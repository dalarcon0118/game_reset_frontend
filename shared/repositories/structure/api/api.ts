import { apiClient } from '@/shared/services/api_client';
import { settings } from '@/config/settings';
import { BackendChildStructure, BackendListeroDetails } from '../types/types';
import { ChildStructureArrayCodec, ListeroDetailsCodec, DashboardSummaryCodec, decodeOrFallback } from '../codecs/codecs';
import { isLeft } from 'fp-ts/Either';
import { PathReporter } from 'io-ts/PathReporter';
import { logger } from '@/shared/utils/logger';
import { StructureMapper } from '../mappers/mappers';
import { Agency, DashboardSummary } from '../domain/models';

const log = logger.withTag('STRUCTURE_API');

export const StructureApi = {
    getChildren: async (id: number, level: number = 1): Promise<Agency[]> => {
        const params = new URLSearchParams();
        params.append('level', level.toString());
        params.append('active', 'true');
        params.append('draw', 'true');
        params.append('today', 'true');

        const endpoint = `${settings.api.endpoints.structures()}${id}/children/?${params.toString()}`;
        const response = await apiClient.get<BackendChildStructure[]>(endpoint);

        const decoded = ChildStructureArrayCodec.decode(response);
        if (isLeft(decoded)) {
            const errorReport = PathReporter.report(decoded).join('; ');
            log.error('getChildren decode failed', { error: errorReport, id });
            throw new Error(`Invalid response from structure children API: ${errorReport}`);
        }

        return StructureMapper.toAgencies(decoded.right);
    },

    getSummary: async (id: number, date?: string): Promise<DashboardSummary> => {
        const params = new URLSearchParams();
        params.append('structure_id', id.toString());
        if (date) params.append('date', date);

        const endpoint = `${settings.api.endpoints.financialStatement()}?${params.toString()}`;
        const response = await apiClient.get<any>(endpoint);

        const decoded = DashboardSummaryCodec.decode(response);
        if (isLeft(decoded)) {
            const errorReport = PathReporter.report(decoded).join('; ');
            log.error('getSummary decode failed', { error: errorReport, id });
            throw new Error(`Invalid response from summary API: ${errorReport}`);
        }

        return StructureMapper.toDashboardSummary(decoded.right);
    },

    getListeroDetails: async (id: number, date?: string): Promise<BackendListeroDetails> => {
        let endpoint = `${settings.api.endpoints.structures()}${id}/listero_details/`;
        if (date) {
            endpoint += `?date=${date}`;
        }
        const response = await apiClient.get<BackendListeroDetails>(endpoint);
        return decodeOrFallback(ListeroDetailsCodec, response, 'getListeroDetails') as BackendListeroDetails;
    }
};
