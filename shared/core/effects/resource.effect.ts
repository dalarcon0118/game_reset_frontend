import { logger } from '../../utils/logger';
import { AppKernel } from '../architecture/kernel';
import { RemoteData, WebData } from '../remote.data';

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
        data = await AppKernel.dataProvider.getList(resource, payload.params);
        break;
      case 'GET_ONE':
        data = await AppKernel.dataProvider.getOne(resource, payload.id);
        break;
      case 'CREATE':
        data = await AppKernel.dataProvider.create(resource, payload.variables);
        break;
      case 'UPDATE':
        data = await AppKernel.dataProvider.update(resource, payload.id, payload.variables);
        break;
      case 'DELETE':
        data = await AppKernel.dataProvider.delete(resource, payload.id);
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
