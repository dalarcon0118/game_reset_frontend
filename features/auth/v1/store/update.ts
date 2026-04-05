import { match } from 'ts-pattern';
import { LoginModel, initialModel } from './model';
import {
    LoginMsg,
    USERNAME_UPDATED,
    PIN_UPDATED,
    HYDRATION_STARTED,
    HYDRATION_COMPLETED,
    RESET_LOGIN_UI,
    EDIT_USERNAME_TOGGLED,
    LOGIN_TRIGGERED
} from './msg';
import { Return, singleton, ret } from '@core/tea-utils/return';
import { Cmd } from '@core/tea-utils/cmd';
import { GlobalSignals } from '@/config/signals';
import { RemoteDataHttp } from '@core/tea-utils/remote.data.http';
import { AuthRepository } from '@/shared/repositories/auth';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('LOGIN_UI_UPDATE');

export function update(model: LoginModel, msg: LoginMsg): Return<LoginModel, LoginMsg> {
    return match<LoginMsg, Return<LoginModel, LoginMsg>>(msg)
        .with(HYDRATION_STARTED.type(), () => {
            return ret(
                model,
                RemoteDataHttp.fetch(
                    () => AuthRepository.getLastUsername(),
                    (result) => {
                        const username = result.type === 'Success' ? result.data : '';
                        return HYDRATION_COMPLETED({ username: username || '' });
                    },
                    'GET_LAST_USERNAME'
                )
            );
        })

        .with(HYDRATION_COMPLETED.type(), ({ payload }) => {
            return singleton({
                ...model,
                username: payload.username,
                isEditingUsername: !payload.username
            });
        })

        .with(USERNAME_UPDATED.type(), ({ payload }) => {
            return singleton({
                ...model,
                username: payload.username,
                isEditingUsername: false // Cerramos edición al guardar
            });
        })

        .with(PIN_UPDATED.type(), ({ payload }) => {
            const newPin = payload.pin;
            const newModel = { ...model, pin: newPin };

            // ✨ LÓGICA DE ELM: Trigger automático de login en el update
            // Cuando el PIN tiene 6 dígitos y el username existe, disparamos login
            if (newPin.length === 6 && model.username && model.username.length > 0) {
                log.info(`[LOGIN_FLOW] 🎯 PIN completo (6 dígitos). Disparando señal de login global para ${model.username}...`);
                return ret(
                    newModel,
                    Cmd.sendMsg(GlobalSignals.LOGIN({
                        username: model.username,
                        pin: newPin
                    }))
                );
            }

            return singleton(newModel);
        })

        .with(EDIT_USERNAME_TOGGLED.type(), ({ payload }) => {
            return singleton({
                ...model,
                isEditingUsername: payload.isEditing
            });
        })

        .with(RESET_LOGIN_UI.type(), () => {
            return singleton({
                ...initialModel,
                username: model.username, // Preservar el usuario al resetear el PIN
                isEditingUsername: false
            });
        })

        .with(LOGIN_TRIGGERED.type(), ({ payload }) => {
            log.info(`[LOGIN_FLOW] 🚀 Login disparado manualmente vía señal global para ${payload.username}`);
            return ret(
                model,
                Cmd.sendMsg(GlobalSignals.LOGIN({
                    username: payload.username,
                    pin: payload.pin
                }))
            );
        })

        .otherwise(() => singleton(model));
}
