import { logger } from '../../utils/logger';
import apiClient from '../../services/api_client';
import { RemoteData, WebData } from '../tea-utils/remote.data';

const log = logger.withTag('RESOURCE_EFFECT');

export type ResourceOperation = 'LIST' | 'GET_ONE' | 'CREATE' | 'UPDATE' | 'DELETE';

export interface BaseResourcePayload {
  resource: string;
  msgCreator: (data: WebData<any>) => any;
}

export interface ResourceListPayload extends BaseResourcePayload {
  operation: 'LIST';
  params?: any;
}

export interface ResourceGetOnePayload extends BaseResourcePayload {
  operation: 'GET_ONE';
  id: string | number;
}

export interface ResourceCreatePayload extends BaseResourcePayload {
  operation: 'CREATE';
  variables: any;
}

export interface ResourceUpdatePayload extends BaseResourcePayload {
  operation: 'UPDATE';
  id: string | number;
  variables: any;
}

export interface ResourceDeletePayload extends BaseResourcePayload {
  operation: 'DELETE';
  id: string | number;
}

export type ResourcePayload =
  | ResourceListPayload
  | ResourceGetOnePayload
  | ResourceCreatePayload
  | ResourceUpdatePayload
  | ResourceDeletePayload;

export async function handleResource(payload: ResourcePayload, dispatch: (msg: any) => void) {
  const { resource, msgCreator } = payload;

  try {
    let data;
    switch (payload.operation) {
      case 'LIST':
        data = await apiClient.get(resource, { queryParams: payload.params });
        break;
      case 'GET_ONE':
        data = await apiClient.get(`${resource}/${payload.id}/`);
        break;
      case 'CREATE':
        data = await apiClient.post(resource, payload.variables);
        break;
      case 'UPDATE':
        data = await apiClient.put(`${resource}/${payload.id}/`, payload.variables);
        break;
      case 'DELETE':
        data = await apiClient.delete(`${resource}/${payload.id}/`);
        break;
      default:
        throw new Error(`Unknown resource operation: ${(payload as any).operation}`);
    }
    dispatch(msgCreator(RemoteData.success(data)));
  } catch (error) {
    log.error(`Resource ${payload.operation} failed for ${resource}`, error);
    dispatch(msgCreator(RemoteData.failure(error)));
  }
}
