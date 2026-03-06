import { createElmStore } from '@/shared/core/engine/engine';
import { initialModel, Model } from './model';
import { update } from './update';
import { subscriptions } from './subscriptions';
import { createLoggerMiddleware } from '@/shared/core/middlewares/logger.middleware';
import { Msg } from './msg';
import { Cmd } from '@/shared/core/tea-utils';

export const useFinancialIntegrityStore = createElmStore<Model, Msg>({
  initial: (params: any) => [initialModel(params), Cmd.none],
  update: (model, msg) => update(msg, model),
  subscriptions
});
