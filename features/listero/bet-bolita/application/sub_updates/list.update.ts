import { match } from 'ts-pattern';
import { BolitaModel } from '../../domain/models/bolita.types';
import { ListMsg, ListMsgType } from '../../domain/models/bolita.messages';
import { Return, ret, singleton, Cmd, RemoteData } from '@core/tea-utils';
import { betRepository } from '@/shared/repositories/bet/bet.repository';
import { BolitaImpl } from '../../domain/bolita.impl';

export const updateList = (model: BolitaModel, msg: ListMsg): Return<BolitaModel, ListMsg> => {
    return match<ListMsg, Return<BolitaModel, ListMsg>>(msg)
        .with({ type: ListMsgType.FETCH_BETS_REQUESTED }, ({ drawId }) => {
            return ret(
                {
                    ...model,
                    listState: { ...model.listState, remoteData: RemoteData.loading() }
                },
                Cmd.task({
                    task: async () => {
                        const result = await betRepository.getBets({ drawId });
                        if (result.isErr()) throw result.error;
                        return result.value;
                    },
                    onSuccess: (bets) => ({
                        type: ListMsgType.FETCH_BETS_RECEIVED,
                        webData: RemoteData.success(BolitaImpl.persistence.transformBets(bets))
                    }),
                    onFailure: (err) => ({
                        type: ListMsgType.FETCH_BETS_RECEIVED,
                        webData: RemoteData.failure(err as Error)
                    })
                })
            );
        })
        .with({ type: ListMsgType.FETCH_BETS_RECEIVED }, ({ webData }) => {
            const summary = webData.type === 'Success'
                ? BolitaImpl.calculation.calculateSummary(webData.data)
                : model.listState.summary;

            return singleton({
                ...model,
                listState: { ...model.listState, remoteData: webData, summary }
            });
        })
        .with({ type: ListMsgType.REFRESH_BETS_REQUESTED }, ({ drawId }) => {
            return ret(
                {
                    ...model,
                    listState: { ...model.listState, isRefreshing: true }
                },
                Cmd.task({
                    task: async () => {
                        const result = await betRepository.getBets({ drawId });
                        if (result.isErr()) throw result.error;
                        return result.value;
                    },
                    onSuccess: (bets) => ({
                        type: ListMsgType.REFRESH_BETS_RECEIVED,
                        webData: RemoteData.success(BolitaImpl.persistence.transformBets(bets))
                    }),
                    onFailure: (err) => ({
                        type: ListMsgType.REFRESH_BETS_RECEIVED,
                        webData: RemoteData.failure(err as Error)
                    })
                })
            );
        })
        .with({ type: ListMsgType.REFRESH_BETS_RECEIVED }, ({ webData }) => {
            const summary = webData.type === 'Success'
                ? BolitaImpl.calculation.calculateSummary(webData.data)
                : model.listState.summary;

            return singleton({
                ...model,
                listState: { ...model.listState, remoteData: webData, summary, isRefreshing: false }
            });
        })
        .otherwise(() => singleton(model));
};
