import { createElmStore } from '@/shared/core/engine';
import { initialModel, Model } from './model';
import { update } from './update';
import { subscriptions } from './subscriptions';

export const useFinancialIntegrityStore = createElmStore<Model, any>(
  (params) => [initialModel(params), null],
  update,
  {}, // effectHandlers
  subscriptions
);
