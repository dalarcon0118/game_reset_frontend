import { createElmStore } from '@/shared/core/engine';
import { initialModel, Model } from './model';
import { update } from './update';
import { subscriptions } from './subscriptions';
import { createLoggerMiddleware } from '@/shared/core/middlewares/logger.middleware';

export const useFinancialIntegrityStore = createElmStore<Model, any>(
  (params) => [initialModel(params), null],
  update,
  {}, // effectHandlers
  subscriptions,
  [createLoggerMiddleware()]
);
