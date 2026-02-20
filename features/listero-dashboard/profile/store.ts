import { createElmStore } from '@/shared/core/engine';
import { effectHandlers } from '@/shared/core/effect_handlers';
import { ProfileModel, ProfileMsg } from './profile.types';
import { updateProfile, init } from './profile.update';

import { createLoggerMiddleware } from '@/shared/core/middlewares/logger.middleware';

export const useProfileStore = createElmStore<ProfileModel, ProfileMsg>(
    init,
    updateProfile,
    effectHandlers as any,
    undefined,
    [createLoggerMiddleware()]
);
// Selectors
export const selectProfileModel = (state: { model: ProfileModel }) => state.model;
export const selectDispatch = (state: { dispatch: (msg: ProfileMsg) => void }) => state.dispatch;
export const selectInit = (state: { init: () => void }) => state.init;
