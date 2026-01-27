import { RemoteData } from '../../core/remote.data';
import { Return, singleton } from '../../core/return';
import { Model, Msg, init } from './DataView.types';
import { update } from './DataView.update';

/**
 * Factory to create a DataView service instance for a specific data type.
 * This makes it easier to compose multiple DataViews into a single store.
 */
export const createDataViewService = <T, E = any>(fetchFn: () => Promise<T>) => {
  return {
    /**
     * Initial state for this data view instance.
     */
    init: (): Model<T, E> => init<T, E>(),

    /**
     * Update function for this specific instance.
     */
    update: (msg: Msg<T, E>, model: Model<T, E>): Return<Model<T, E>, Msg<T, E>> =>
      update(msg, model, fetchFn),

    /**
     * Msg creators for this instance.
     */
    msg: {
      fetch: (): Msg<T, E> => ({ type: 'FETCH_START' }),
      complete: (data: RemoteData<E, T>): Msg<T, E> => ({
        type: 'FETCH_COMPLETE',
        payload: data
      }),
      reset: (): Msg<T, E> => ({ type: 'RESET' }),
    },

    /**
     * Helper to create a FETCH_COMPLETE message from a Success
     */
    success: (data: T): Msg<T, E> => ({
      type: 'FETCH_COMPLETE',
      payload: RemoteData.success(data)
    }),

    /**
     * Helper to create a FETCH_COMPLETE message from a Failure
     */
    failure: (error: E): Msg<T, E> => ({
      type: 'FETCH_COMPLETE',
      payload: RemoteData.failure(error)
    }),

    /**
     * Composition helper for the parent's update function.
     * Use this with .andMapCmd()
     */
    compose: <ParentMsg>(
      modelMapper: (m: Model<T, E>) => any,
      msgWrapper: (subMsg: Msg<T, E>) => ParentMsg,
      msg: Msg<T, E>,
      model: Model<T, E>
    ): Return<any, ParentMsg> => {
      return singleton(modelMapper).andMapCmd(
        msgWrapper,
        update(msg, model, fetchFn)
      );
    }
  };
};
