import { Return, RemoteData } from '@core/tea-utils';
import { PromotionState } from './model';
import { Msg } from './msg';

export const initialState = (): Return<PromotionState, Msg> => {
    return Return.singleton({
        promotions: RemoteData.notAsked(),
        showPromotionsModal: false,
        hasBeenShown: false,
    });
};
