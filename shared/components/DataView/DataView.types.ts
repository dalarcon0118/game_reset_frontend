import { RemoteData } from '../../core/remote.data';

export interface Model<T, E = any> {
  remoteData: RemoteData<E, T>;
  lastUpdated: number | null;
}

export type Msg<T, E = any> =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_COMPLETE'; payload: RemoteData<E, T> }
  | { type: 'RESET' };

export const init = <T, E = any>(): Model<T, E> => ({
  remoteData: RemoteData.notAsked(),
  lastUpdated: null,
});
