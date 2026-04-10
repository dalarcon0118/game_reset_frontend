import { IDlqApi } from '../dlq.ports';
import { DlqItem } from '../dlq.types';
import apiClient from '@/shared/services/api_client';
import settings from '@/config/settings';
import { logger } from '@/shared/utils/logger';
import { RepositoriesModule } from '@/shared/repositories';
import type { IAuthRepository } from '@/shared/repositories/auth/auth.ports';

const log = logger.withTag('DlqApiAdapter');

interface BetPayload {
    externalId?: string;
    drawId?: string | number;
    amount?: number | string;
    ownerUser?: string | number;
    ownerStructure?: string | number;
    receiptCode?: string;
    [key: string]: any;
}

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

    async reportItem(domain: string, entityId: string, payload: any, error: any): Promise<void> {
        log.info(`[DlqApiAdapter] 📤 Reportando DLQ item al backend: domain=${domain}, entityId=${entityId}`);

        try {
            const authRepo = RepositoriesModule.getSync<IAuthRepository>('AuthRepository');
            const currentUser = await authRepo.getUserIdentity();
            const userId = currentUser?.id ? String(currentUser.id) : undefined;
            log.debug(`[DlqApiAdapter] 🔍 TRACE auth: currentUser=${JSON.stringify(currentUser)}, resolved userId=${userId}`);

            const betPayload = payload as BetPayload;
            const endpoint = settings.api.endpoints.dlq.report();

            const backendPayload = {
                idempotency_key: betPayload.externalId || entityId,
                local_id: entityId,
                draw_id: betPayload.drawId ? String(betPayload.drawId) : undefined,
                amount: betPayload.amount ? Number(betPayload.amount) : undefined,
                error: typeof error === 'string' ? error : error?.message || JSON.stringify(error),
                user_id: userId,
                bet_data: payload
            };

            log.info(`[DlqApiAdapter] 📦 Payload completo enviado al backend: ${JSON.stringify(backendPayload)}`);
            log.debug(`[DlqApiAdapter] 🔍 TRACE payload details: ownerUser=${betPayload.ownerUser}, ownerStructure=${betPayload.ownerStructure}, receiptCode=${betPayload.receiptCode}`);

            await apiClient.post(endpoint, backendPayload);
            log.info(`[DlqApiAdapter] ✅ DLQ item reportado exitosamente: ${entityId}`);
        } catch (error: any) {
            log.error(`[DlqApiAdapter] ❌ Falló reporte de DLQ item ${entityId}: status=${error.status}, message=${error.message}`);
            log.debug(`[DlqApiAdapter] 🔍 TRACE error response: ${JSON.stringify(error.response)}`);
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
