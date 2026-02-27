import { Model } from './model';
import { SubDescriptor } from '@/shared/core/sub';
import { Msg } from './msg';
import { DashboardGateway } from '../gateways/external.gateway';

export const subscriptions = (model: Model): SubDescriptor<Msg> => {
    return DashboardGateway.subscriptions(model);
};
