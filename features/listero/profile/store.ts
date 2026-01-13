import { createElmStore } from '@/shared/core/engine';
import { effectHandlers } from '@/shared/core/effectHandlers';
import { ProfileModel, ProfileMsg } from './profile.types';
import { updateProfile, init } from './profile.update';

export const useProfileStore = createElmStore<ProfileModel, ProfileMsg>(
    init,
    updateProfile,
    effectHandlers as any
);

// Selectors
export const selectProfileModel = (state: { model: ProfileModel }) => state.model;
export const selectDispatch = (state: { dispatch: (msg: ProfileMsg) => void }) => state.dispatch;
export const selectInit = (state: { init: () => void }) => state.init;
