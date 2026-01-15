import { match } from 'ts-pattern';
import { ProfileModel, ProfileMsg, ProfileMsgType, initialProfileModel, UserProfile, Incident } from './profile.types';
import { Cmd } from '@/shared/core/cmd';
import { Return, ret } from '@/shared/core/return';
import apiClient from '@/shared/services/ApiClient';
import settings from '@/config/settings';

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

const fetchIncidentsCmd = () => {
    return Cmd.task({
        task: () => apiClient.get<Incident[]>(settings.api.endpoints.incidents),
        onSuccess: (incidents) => ({ type: ProfileMsgType.FETCH_INCIDENTS_SUCCEEDED, incidents }),
        onFailure: (error) => ({ type: ProfileMsgType.FETCH_INCIDENTS_FAILED, error: String(error) })
    });
};

const changePasswordCmd = (newPin: string) => {
    return Cmd.task({
        task: () => apiClient.post(settings.api.endpoints.changePin, { pin: newPin }),
        onSuccess: () => ({ type: ProfileMsgType.CHANGE_PASSWORD_SUCCEEDED }),
        onFailure: (error) => ({ type: ProfileMsgType.CHANGE_PASSWORD_FAILED, error: String(error) })
    });
};

export const init = (params?: any): [ProfileModel, Cmd] => {
    const result = ret(
        {
            ...initialProfileModel,
            user: { type: 'Loading' } as any,
            incidents: { type: 'Loading' } as any
        },
        [fetchProfileCmd(), fetchIncidentsCmd()]
    );
    return [result.model, result.cmd];
};

export const updateProfile = (model: ProfileModel, msg: ProfileMsg): [ProfileModel, Cmd] => {
    const result: Return<ProfileModel, ProfileMsg> = match<ProfileMsg, Return<ProfileModel, ProfileMsg>>(msg)
        .with({ type: ProfileMsgType.INIT }, () => {
            return ret(
                {
                    ...model,
                    user: { type: 'Loading' } as any,
                    incidents: { type: 'Loading' } as any
                },
                [fetchProfileCmd(), fetchIncidentsCmd()]
            );
        })
        .with({ type: ProfileMsgType.FETCH_PROFILE_SUCCEEDED }, ({ profile }) => {
            return ret(
                { ...model, user: { type: 'Success', data: profile } },
                []
            );
        })
        .with({ type: ProfileMsgType.FETCH_PROFILE_FAILED }, ({ error }) => {
            return ret(
                { ...model, user: { type: 'Failure', error } },
                []
            );
        })
        .with({ type: ProfileMsgType.FETCH_INCIDENTS_SUCCEEDED }, ({ incidents }) => {
            return ret(
                { ...model, incidents: { type: 'Success', data: incidents } },
                []
            );
        })
        .with({ type: ProfileMsgType.FETCH_INCIDENTS_REQUESTED }, () => {
            return ret(
                { ...model, incidents: { type: 'Loading' } as any },
                [fetchIncidentsCmd()]
            );
        })
        .with({ type: ProfileMsgType.FETCH_INCIDENTS_FAILED }, ({ error }) => {
            return ret(
                { ...model, incidents: { type: 'Failure', error } },
                []
            );
        })
        .with({ type: ProfileMsgType.LOGOUT_REQUESTED }, () => {
            // Here we would dispatch a global logout command or call auth service
            console.log('Logging out...');
            return ret({ ...model, isLoggingOut: true }, []);
        })
        .with({ type: ProfileMsgType.CHANGE_PASSWORD_REQUESTED }, () => {
            return ret(model, [
                Cmd.navigate({ pathname: 'lister/change_password' })
            ]);
        })
        .with({ type: ProfileMsgType.NEW_PIN_CHANGED }, ({ pin }) => {
            return ret({
                ...model,
                changePasswordSession: { ...model.changePasswordSession, newPin: pin }
            }, []);
        })
        .with({ type: ProfileMsgType.CONFIRM_PIN_CHANGED }, ({ pin }) => {
            return ret({
                ...model,
                changePasswordSession: { ...model.changePasswordSession, confirmPin: pin }
            }, []);
        })
        .with({ type: ProfileMsgType.SUBMIT_CHANGE_PASSWORD }, () => {
            return ret({
                ...model,
                changePasswordSession: { ...model.changePasswordSession, status: 'submitting', error: null }
            }, [changePasswordCmd(model.changePasswordSession.newPin)]);
        })
        .with({ type: ProfileMsgType.CHANGE_PASSWORD_SUCCEEDED }, () => {
            return ret({
                ...model,
                changePasswordSession: { ...model.changePasswordSession, status: 'success', newPin: '', confirmPin: '' }
            }, [
                Cmd.alert({
                    title: 'Éxito',
                    message: 'Tu PIN ha sido actualizado correctamente.',
                    buttons: [{ text: 'OK' }]
                }),
                Cmd.navigate({ method: 'back', pathname: '' })
            ]);
        })
        .with({ type: ProfileMsgType.CHANGE_PASSWORD_FAILED }, ({ error }) => {
            return ret({
                ...model,
                changePasswordSession: { ...model.changePasswordSession, status: 'failure', error }
            }, []);
        })
        .with({ type: ProfileMsgType.RESET_CHANGE_PASSWORD }, () => {
            return ret({
                ...model,
                changePasswordSession: initialProfileModel.changePasswordSession
            }, []);
        })
        .with({ type: ProfileMsgType.NAVIGATE_TO }, ({ route, params }) => {
            return ret(model, [Cmd.navigate({ pathname: route, params })]);
        })
        .exhaustive();

    return [result.model, result.cmd];
};
