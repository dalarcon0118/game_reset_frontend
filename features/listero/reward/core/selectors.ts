import { RewardModel } from './types';

export const RewardSelectors = {
  selectBetTypesStatus: (model: RewardModel) => model.betTypes.status,
  selectStructureId: (model: RewardModel) => model.structureId,
  selectIsLoading: (model: RewardModel) => model.betTypes.status._tag === 'Loading',
  selectHasError: (model: RewardModel) => model.betTypes.status._tag === 'Failure',
  selectHasData: (model: RewardModel) => {
    const status = model.betTypes.status;
    return status._tag === 'Success' && status.data !== null && (status.data.draw_types?.length ?? 0) > 0;
  },
};
