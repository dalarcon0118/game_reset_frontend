import { match } from 'ts-pattern';
import { ProfileModel, ProfileMsg, ProfileMsgType, initialProfileModel, UserProfile } from './profile.types';
import { Cmd } from '@/shared/core/cmd';
import { Return, ret } from '@/shared/core/return';

// Mock API call for now, can be replaced with real service later
const fetchProfileCmd = () => {
    // Simulating API delay
    return Cmd.task({
        task: () => new Promise<UserProfile>((resolve) => {
            setTimeout(() => {
                resolve({
                    id: '123',
                    firstName: 'José Pérez',
                    alias: 'El Rápido',
                    zone: 'Occidental / Habana / Centro',
                    status: 'ACTIVE'
                });
            }, 1000);
        }),
        onSuccess: (profile) => ({ type: ProfileMsgType.FETCH_PROFILE_SUCCEEDED, profile }),
        onFailure: (error) => ({ type: ProfileMsgType.FETCH_PROFILE_FAILED, error: String(error) })
    });
};

// ... imports

export const init = (params?: any): [ProfileModel, Cmd] => {
    const result = ret(
        { ...initialProfileModel, user: { type: 'Loading' } },
        [fetchProfileCmd()]
    );
    return [result.model, result.cmd];
};

export const updateProfile = (model: ProfileModel, msg: ProfileMsg): [ProfileModel, Cmd] => {
    const result: Return<ProfileModel, ProfileMsg> = match<ProfileMsg, Return<ProfileModel, ProfileMsg>>(msg)
        .with({ type: ProfileMsgType.INIT }, () => {
            return ret(
                { ...model, user: { type: 'Loading' } },
                [fetchProfileCmd()]
            );
        })
        .with({ type: ProfileMsgType.FETCH_PROFILE_SUCCEEDED }, ({ profile }) => {
            return ret(
                { ...model, user: { type: 'Success', data: profile } }
            );
        })
        .with({ type: ProfileMsgType.FETCH_PROFILE_FAILED }, ({ error }) => {
            return ret(
                { ...model, user: { type: 'Failure', error } }
            );
        })
        .with({ type: ProfileMsgType.LOGOUT_REQUESTED }, () => {
            // Here we would dispatch a global logout command or call auth service
            console.log('Logging out...');
            return ret({ ...model, isLoggingOut: true });
        })
        .with({ type: ProfileMsgType.NAVIGATE_TO }, ({ route }) => {
            console.log('Navigating to:', route);
            return ret(model);
        })
        .exhaustive();

    return [result.model, result.cmd];
};
