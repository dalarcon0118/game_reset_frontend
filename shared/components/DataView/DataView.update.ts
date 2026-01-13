import { match } from 'ts-pattern';
import { Model, Msg } from './DataView.types';
import { Return, ret, singleton } from '../../core/return';
import { RemoteData } from '../../core/remote.data';
import { RemoteDataHttp } from '../../core/remote.data.http';

export const update = <T, E>(
  msg: Msg<T, E>,
  model: Model<T, E>,
  fetchFn: () => Promise<T>
): Return<Model<T, E>, Msg<T, E>> => {
  return match<Msg<T, E>, Return<Model<T, E>, Msg<T, E>>>(msg)
    .with({ type: 'FETCH_START' }, () => {
      return ret(
        { ...model, remoteData: RemoteData.loading() },
        RemoteDataHttp.fetch(fetchFn, (payload) => ({
          type: 'FETCH_COMPLETE',
          payload
        }))
      );
    })
    .with({ type: 'FETCH_COMPLETE' }, ({ payload }) => {
      return singleton({
        ...model,
        remoteData: payload,
        lastUpdated: RemoteData.isSuccess(payload) ? Date.now() : model.lastUpdated,
      });
    })
    .with({ type: 'RESET' }, () => {
      return singleton({
        ...model,
        remoteData: RemoteData.notAsked(),
        lastUpdated: null,
      });
    })
    .exhaustive();
};
