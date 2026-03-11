import { Cmd } from '@/shared/core/tea-utils';
import { promotionApi } from '@/shared/services/promotion/api';
import { PROMOTIONS_RECEIVED } from './msg';
import { ensureError } from '@/shared/utils/error';

export const fetchPromotionsCmd = (): Cmd => {
    return Cmd.task({
        task: async () => {
            const promotions = await promotionApi.getPromotions();
            return promotions;
        },
        onSuccess: (data) => PROMOTIONS_RECEIVED({ type: 'Success', data }),
        onFailure: (error) => PROMOTIONS_RECEIVED({ type: 'Failure', error: ensureError(error) })
    });
};
