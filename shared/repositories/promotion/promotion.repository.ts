import { promotionApi } from '@/shared/repositories/promotion/adapter/api';
import { PromotionMapper } from './promotion.mapper';
import { Promotion } from '../../components/promotion/model';

import { storageClient } from '../../core/offline-storage/storage_client';

export interface IPromotionRepository {
    getAll(): Promise<Promotion[]>;
    markAsShown(): Promise<void>;
}

export class PromotionRepository implements IPromotionRepository {
    private readonly STORAGE_KEY = 'PROMOTION_SHOWN_FLAG';

    async getAll(): Promise<Promotion[]> {
        // Encapuslamos la decisión de visibilidad: si ya se mostró, devolvemos vacío sin ir a red
        const hasBeenShown = await storageClient.get<boolean>(this.STORAGE_KEY);
        if (hasBeenShown) {
            return [];
        }

        const responses = await promotionApi.getPromotions();
        return PromotionMapper.toDomainList(responses);
    }

    async markAsShown(): Promise<void> {
        await storageClient.set(this.STORAGE_KEY, true);
    }
}

// Export singleton instance for default use
export const promotionRepository = new PromotionRepository();
