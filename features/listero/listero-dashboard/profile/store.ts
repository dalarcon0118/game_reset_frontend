import { createElmStore } from '@core/engine/engine';
import { effectHandlers } from '@core/tea-utils';
import { ProfileModel, ProfileMsg } from './profile.types';
import { updateProfile, init } from './profile.update';

export const useProfileStore = createElmStore<ProfileModel, ProfileMsg>({
    initial: init,
    update: updateProfile
});
// Selectors
export const selectProfileModel = (state: { model: ProfileModel }) => state.model;
export const selectDispatch = (state: { dispatch: (msg: ProfileMsg) => void }) => state.dispatch;
export const selectInit = (state: { init: () => void }) => state.init;
