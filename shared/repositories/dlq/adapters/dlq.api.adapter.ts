import { IDlqApi } from '../dlq.ports';
import { DlqItem } from '../dlq.types';
import apiClient from '@/shared/services/api_client';
import settings from '@/config/settings';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('DlqApiAdapter');

export class DlqApiAdapter implements IDlqApi {
    async syncItems(items: DlqItem[]): Promise<{ success: number; failed: number }> {
        if (items.length === 0) {
            return { success: 0, failed: 0 };
        }

        log.info(`Syncing ${items.length} DLQ items to backend`);

        try {
            const endpoint = settings.api.endpoints.dlq?.sync?.();
            const response = await apiClient.post<{ success: number; failed: number }>(endpoint, {
                items
            });

            log.info(`DLQ sync response`, response);
            return response;
        } catch (error) {
            log.error(`Failed to sync DLQ items to backend`, error);
            return { success: 0, failed: items.length };
        }
    }

    /**
     * Reporta un item al backend directamente.
     * Usa el ID en la URL para que el backend pueda hacer idempotencia.
     */
    async reportItem(domain: string, entityId: string, payload: any, error: any): Promise<void> {
        log.debug(`Reporting DLQ item to backend: ${domain}:${entityId}`);

        try {
            const endpoint = settings.api.endpoints.dlq.report(entityId);
            await apiClient.post(endpoint, { domain, entityId, payload, error });
        } catch (error) {
            log.warn(`Failed to report DLQ item ${entityId}`, error);
            throw error;
        }
    }

    async reconcile(id: string, resolution: 'reconcile' | 'discard'): Promise<void> {
        log.info(`Reconciling DLQ item ${id} with resolution: ${resolution}`);

        try {
            const endpoint = settings.api.endpoints.dlq?.reconcile?.(id);
            await apiClient.post(endpoint, { resolution });
        } catch (error) {
            log.error(`Failed to reconcile DLQ item ${id}`, error);
            throw error;
        }
    }
}
