import { Sub } from '@/shared/core/sub';
import { Model } from './model';
import { Msg } from './msg';

export const subscriptions = (model: Model) => {
  // No subscriptions needed for now
  return Sub.none();
};