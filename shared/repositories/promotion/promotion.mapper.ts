import { PromotionResponse } from '@/shared/repositories/promotion/adapter/types';
import { Promotion } from '../../components/promotion/model';

export const PromotionMapper = {
    toDomain: (response: PromotionResponse): Promotion => {
        return {
            id: response.id,
            title: response.title,
            subtitle: response.subtitle,
            description: response.description,
            image_url: response.image_url,
            promotion_type: response.promotion_type,
            priority: response.priority,
            structure: response.structure,
            style_config: response.style_config,
        };
    },

    toDomainList: (responses: PromotionResponse[]): Promotion[] => {
        return (responses || []).map(PromotionMapper.toDomain);
    }
};
