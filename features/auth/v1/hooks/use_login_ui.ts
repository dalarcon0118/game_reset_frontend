import { useMemo } from 'react';
import { useLoginStore } from '../store';
import {
    USERNAME_UPDATED,
    PIN_UPDATED,
    EDIT_USERNAME_TOGGLED,
    HYDRATION_STARTED,
    RESET_LOGIN_UI
} from '../store/msg';

/**
 * useLoginUI
 * Hook especializado para la UI de Login.
 * Maneja el estado local del formulario (username, pin) y la hidratación inicial.
 */
export const useLoginUI = () => {
    const { model, dispatch } = useLoginStore();

    return useMemo(() => ({
        // Estado
        username: model.username,
        pin: model.pin,
        isEditingUsername: model.isEditingUsername,

        // Acciones
        updateUsername: (username: string) => dispatch(USERNAME_UPDATED({ username })),
        updatePin: (pin: string) => dispatch(PIN_UPDATED({ pin })),
        appendPin: (val: string) => {
            if (model.pin.length < 6) {
                dispatch(PIN_UPDATED({ pin: model.pin + val }));
            }
        },
        removeLastPin: () => {
            dispatch(PIN_UPDATED({ pin: model.pin.slice(0, -1) }));
        },
        toggleEditUsername: (isEditing: boolean) => dispatch(EDIT_USERNAME_TOGGLED({ isEditing })),
        hydrateUI: () => dispatch(HYDRATION_STARTED()),
        resetUI: () => dispatch(RESET_LOGIN_UI()),

        // Dispatch directo
        dispatch
    }), [model, dispatch]);
};
