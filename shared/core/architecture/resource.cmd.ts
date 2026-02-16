
import { AppKernel } from './kernel';
import { ListParams } from './interfaces';

/**
 * Resource Commands
 * These commands are handled by the generic effect handlers that talk to the Kernel.
 */

export type ResourceCmd<Msg> =
    | { type: 'RESOURCE_GET_LIST'; resource: string; params?: ListParams; onSuccess: (data: any) => Msg; onError: (err: any) => Msg }
    | { type: 'RESOURCE_GET_ONE'; resource: string; id: string | number; onSuccess: (data: any) => Msg; onError: (err: any) => Msg }
    | { type: 'RESOURCE_CREATE'; resource: string; data: any; onSuccess: (data: any) => Msg; onError: (err: any) => Msg }
    | { type: 'RESOURCE_UPDATE'; resource: string; id: string | number; data: any; onSuccess: (data: any) => Msg; onError: (err: any) => Msg }
    | { type: 'RESOURCE_DELETE'; resource: string; id: string | number; onSuccess: (data: any) => Msg; onError: (err: any) => Msg };

/**
 * Generic Effect Handlers for Resources
 * Register these in your TEA Engine to enable Resource commands.
 */
export const resourceEffectHandlers = {
    RESOURCE_GET_LIST: async (payload: any, dispatch: any) => {
        try {
            const result = await AppKernel.dataProvider.getList(payload.resource, payload.params);
            dispatch(payload.onSuccess(result));
        } catch (error) {
            dispatch(payload.onError(error));
        }
    },
    RESOURCE_GET_ONE: async (payload: any, dispatch: any) => {
        try {
            const result = await AppKernel.dataProvider.getOne(payload.resource, payload.id);
            dispatch(payload.onSuccess(result));
        } catch (error) {
            dispatch(payload.onError(error));
        }
    },
    RESOURCE_CREATE: async (payload: any, dispatch: any) => {
        try {
            const result = await AppKernel.dataProvider.create(payload.resource, payload.data);
            dispatch(payload.onSuccess(result));
        } catch (error) {
            dispatch(payload.onError(error));
        }
    },
    RESOURCE_UPDATE: async (payload: any, dispatch: any) => {
        try {
            const result = await AppKernel.dataProvider.update(payload.resource, payload.id, payload.data);
            dispatch(payload.onSuccess(result));
        } catch (error) {
            dispatch(payload.onError(error));
        }
    },
    RESOURCE_DELETE: async (payload: any, dispatch: any) => {
        try {
            const result = await AppKernel.dataProvider.delete(payload.resource, payload.id);
            dispatch(payload.onSuccess(result));
        } catch (error) {
            dispatch(payload.onError(error));
        }
    }
};
