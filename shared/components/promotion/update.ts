import { match, P } from 'ts-pattern';
import { PromotionState, Promotion } from './model';
import { Msg } from './msg';
import { Return, singleton, ret, RemoteData, WebData } from '@core/tea-utils';
import { fetchPromotionsCmd, markAsShownCmd } from './services/DataServices';
import { DecisionServices } from './services/DecisionServices';

export function update(msg: Msg, model: PromotionState): Return<PromotionState, Msg> {
    return match<Msg, Return<PromotionState, Msg>>(msg)
        .with({ type: 'FETCH_PROMOTIONS_REQUESTED' }, () =>
            ret(
                { ...model, promotions: RemoteData.loading<any, Promotion[]>() },
                fetchPromotionsCmd()
            )
        )
        .with({ type: 'PROMOTIONS_RECEIVED', webData: P.select() }, (webData: WebData<Promotion[]>) => {
            const hasPromotions = webData.type === 'Success' && webData.data.length > 0;
            const shouldShow = hasPromotions && !model.hasBeenShown;

            const nextState: PromotionState = {
                ...model,
                promotions: webData,
                showPromotionsModal: shouldShow,
                hasBeenShown: shouldShow ? true : model.hasBeenShown
            };

            // If we are showing the modal, we must also persist this state
            if (shouldShow) {
                return ret(nextState, markAsShownCmd());
            }

            return singleton(nextState);
        })
        .with({ type: 'CLOSE_PROMOTIONS_MODAL' }, () =>
            singleton({
                ...model,
                showPromotionsModal: false
            })
        )
        .with({ type: 'PARTICIPATE_CLICKED', payload: P.select('promotion'), activeDraws: P.select('activeDraws') }, ({ promotion, activeDraws }) => {
            return ret(
                { ...model, showPromotionsModal: false },
                DecisionServices.handleParticipation(promotion, activeDraws)
            );
        })
        .with({ type: 'MARK_PROMOTIONS_SHOWN' }, () => {
            // This message confirms that the state was persisted
            return singleton({
                ...model,
                hasBeenShown: true
            });
        })
        .exhaustive();
}
