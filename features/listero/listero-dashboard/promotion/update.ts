import { match } from 'ts-pattern';
import { PromotionState } from './model';
import { Msg } from './msg';
import { Return, singleton, ret, RemoteData } from '@/shared/core/tea-utils';
import { fetchPromotionsCmd } from './commands';

export function update(msg: Msg, model: PromotionState): Return<PromotionState, Msg> {
    return match(msg)
        .with({ type: 'FETCH_PROMOTIONS_REQUESTED' }, () =>
            ret(
                { ...model, promotions: RemoteData.loading() },
                fetchPromotionsCmd()
            )
        )
        .with({ type: 'PROMOTIONS_RECEIVED', webData: match.P.select() }, (webData) => {
            const hasPromotions = webData.type === 'Success' && webData.data.length > 0;
            return singleton({
                ...model,
                promotions: webData,
                showPromotionsModal: hasPromotions
            });
        })
        .with({ type: 'CLOSE_PROMOTIONS_MODAL' }, () =>
            singleton({
                ...model,
                showPromotionsModal: false
            })
        )
        .exhaustive();
}
