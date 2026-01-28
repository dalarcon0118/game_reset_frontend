import { match } from 'ts-pattern';
import { ProfileModel, ProfileMsg, ProfileMsgType, initialProfileModel, UserProfile, Incident, DEFAULT_USER_PROFILE } from './profile.types';
import { Cmd } from '@/shared/core/cmd';
import { Return, ret } from '@/shared/core/return';
import apiClient from '@/shared/services/api_client';
import settings from '@/config/settings';
import { User } from '@/features/auth/store/types/auth.types';
import { RemoteDataHttp } from '@/shared/core/remote.data.http';
import { RemoteData } from '@/shared/core/remote.data';
import { hashString } from '@/shared/utils/crypto';

// Fetch real profile data from me endpoint using RemoteDataHttp
const fetchProfileCmd = () => {
    return RemoteDataHttp.fetch(
        () => apiClient.get<User>(settings.api.endpoints.me()),
        (webData) => ({
            type: ProfileMsgType.FETCH_PROFILE_RESPONSE,
            webData: RemoteData.map((user: User): UserProfile => ({
                id: String(user.id),
                firstName: user.name || user.username,
                alias: user.username,
                zone: user.structure?.name || 'N/A',
                status: 'ACTIVE'
            }), webData)
        })
    );
};

const fetchIncidentsCmd = () => {
    return RemoteDataHttp.fetch(
        () => apiClient.get<Incident[]>(settings.api.endpoints.incidents()),
        (webData) => ({
            type: ProfileMsgType.FETCH_INCIDENTS_RESPONSE,
            webData
        })
    );
};

const changePasswordCmd = (newPin: string) => {
    return Cmd.task({
        task: async () => {
            const hashedPin = await hashString(newPin);
            return apiClient.post(settings.api.endpoints.changePin(), { pin: hashedPin });
        },
        onSuccess: () => ({ type: ProfileMsgType.CHANGE_PASSWORD_SUCCEEDED }),
        onFailure: (error) => ({ type: ProfileMsgType.CHANGE_PASSWORD_FAILED, error: String(error) })
    });
};

export const init = (params?: any): [ProfileModel, Cmd] => {
    const result = ret(
        {
            ...initialProfileModel,
            user: RemoteData.loading<any, UserProfile>(),
            userData: DEFAULT_USER_PROFILE,
            incidents: RemoteData.loading<any, Incident[]>()
        },
        [fetchProfileCmd() as any, fetchIncidentsCmd() as any]
    );
    return [result.model, result.cmd as any];
};

export const updateProfile = (model: ProfileModel, msg: ProfileMsg): [ProfileModel, Cmd] => {
    const result: Return<ProfileModel, ProfileMsg> = match<ProfileMsg, Return<ProfileModel, ProfileMsg>>(msg)
        .with({ type: ProfileMsgType.INIT }, () => {
            return ret(
                {
                    ...model,
                    user: RemoteData.loading<any, UserProfile>(),
                    userData: DEFAULT_USER_PROFILE,
                    incidents: RemoteData.loading<any, Incident[]>(),
                    isLoggingOut: false
                },
                [fetchProfileCmd() as any, fetchIncidentsCmd() as any]
            );
        })
        .with({ type: ProfileMsgType.FETCH_PROFILE_RESPONSE }, ({ webData }) => {
            return ret({
                ...model,
                user: webData,
                userData: RemoteData.withDefault(DEFAULT_USER_PROFILE, webData)
            }, []);
        })
        .with({ type: ProfileMsgType.FETCH_INCIDENTS_RESPONSE }, ({ webData }) => {
            return ret({ ...model, incidents: webData }, []);
        })
        .with({ type: ProfileMsgType.FETCH_INCIDENTS_REQUESTED }, () => {
            return ret(
                { ...model, incidents: RemoteData.loading<any, Incident[]>() },
                [fetchIncidentsCmd() as any]
            );
        })
        .with({ type: ProfileMsgType.LOGOUT_REQUESTED }, () => {
            return ret({ ...model, isLoggingOut: true }, [
                Cmd.alert({
                    title: 'Cerrar Sesión',
                    message: '¿Estás seguro de que quieres cerrar sesión?',
                    buttons: [
                        {
                            text: 'Cancelar',
                            style: 'cancel',
                        },
                        {
                            text: 'Cerrar Sesión',
                            style: 'destructive',
                            onPressMsg: { type: ProfileMsgType.SUBMIT_LOGOUT },
                        },
                    ],
                }),
            ]);
        })
        .with({ type: ProfileMsgType.SUBMIT_LOGOUT }, () => {
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
