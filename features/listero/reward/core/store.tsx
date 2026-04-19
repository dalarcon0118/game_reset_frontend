import { createTEAModule, defineTeaModule } from '@core/engine/tea_module';
import { Sub, Cmd } from '@core/tea-utils';
import { RewardModel, RewardMsg, INIT_MODULE } from './types';
import { initialRewardModel } from './model';
import { makeUpdate } from './update';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('RewardStore');

/**
 * 📦 REWARD MODULE DEFINITION
 * Implementa el estándar defineTeaModule para seguir la arquitectura TEA.
 */

export interface RewardModuleParams {
  structureId?: string;
}

const rewardDefinition = defineTeaModule<RewardModel, RewardMsg>({
  name: 'RewardModule',
  initial: (params?: any): [RewardModel, any] => {
    const p = params as RewardModuleParams;
    const model: RewardModel = {
      ...initialRewardModel,
      structureId: p?.structureId || null
    };
    return [model, Cmd.ofMsg(INIT_MODULE({ structureId: p?.structureId }))];
  },
  update: makeUpdate(),
  subscriptions: () => Sub.none()
});

/**
 * 🏪 REWARD MODULE INSTANCE
 * Exporta el Provider y los hooks del módulo.
 */
export const RewardModule = createTEAModule(rewardDefinition);

// Hooks públicos
export const useRewardStore = RewardModule.useStore;
export const useRewardDispatch = RewardModule.useDispatch;
export const RewardProvider = RewardModule.Provider;

// Selectors
export const selectRewardModel = (state: { model: RewardModel }) => state.model;
export const selectRewardDispatch = (state: { dispatch: (msg: RewardMsg) => void }) => state.dispatch;
