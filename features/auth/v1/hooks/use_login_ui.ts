import { useMemo, useRef, useCallback } from 'react';
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
    const dispatchRef = useRef(dispatch);
    dispatchRef.current = dispatch;

    const updateUsername = useCallback((username: string) => {
        dispatchRef.current(USERNAME_UPDATED({ username }));
    }, []);

    const updatePin = useCallback((pin: string) => {
        dispatchRef.current(PIN_UPDATED({ pin }));
    }, []);

    const appendPin = useCallback((val: string) => {
        const currentPin = model.pin;
        if (currentPin.length < 6) {
            dispatchRef.current(PIN_UPDATED({ pin: currentPin + val }));
        }
    }, [model.pin]);

    const removeLastPin = useCallback(() => {
        const currentPin = model.pin;
        dispatchRef.current(PIN_UPDATED({ pin: currentPin.slice(0, -1) }));
    }, [model.pin]);

    const toggleEditUsername = useCallback((isEditing: boolean) => {
        dispatchRef.current(EDIT_USERNAME_TOGGLED({ isEditing }));
    }, []);

    const hydrateUI = useCallback(() => {
        dispatchRef.current(HYDRATION_STARTED());
    }, []);

    const resetUI = useCallback(() => {
        dispatchRef.current(RESET_LOGIN_UI());
    }, []);

    return useMemo(() => ({
        username: model.username,
        pin: model.pin,
        isEditingUsername: model.isEditingUsername,
        updateUsername,
        updatePin,
        appendPin,
        removeLastPin,
        toggleEditUsername,
        hydrateUI,
        resetUI
    }), [model.username, model.pin, model.isEditingUsername]);
};
