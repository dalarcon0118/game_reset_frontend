import { Cmd, RemoteDataHttp } from '@core/tea-utils';
import { IPromotionRepository, promotionRepository } from '../../../repositories/promotion/promotion.repository';
import { Promotion } from '../model';
import { PROMOTIONS_RECEIVED, MARK_PROMOTIONS_SHOWN } from '../msg';

// Composition Root for Promotion component
export const PromotionTeaService = (repo: IPromotionRepository) => {
    return {
        fetchPromotionsCmd: (): Cmd =>
            RemoteDataHttp.request<Promotion[], any>(
                { url: '/promotions' },
                (webData) => PROMOTIONS_RECEIVED(webData),
                () => repo.getAll()
            ),

        markAsShownCmd: (): Cmd =>
            Cmd.task({
                task: async () => {
                    await repo.markAsShown();
                    return MARK_PROMOTIONS_SHOWN();
                },
                onSuccess: (msg) => msg,
                onFailure: (error) => ({ type: 'MARK_SHOWN_ERROR', error })
            })
    };
};

// Application instance (Composition Root)
const service = PromotionTeaService(promotionRepository);

// Export commands for the Update layer
export const fetchPromotionsCmd = service.fetchPromotionsCmd;
export const markAsShownCmd = service.markAsShownCmd;
