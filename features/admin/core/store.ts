// Store for admin dashboard using simplified TEA pattern
import { useState, useCallback } from 'react';
import { Model } from './model';
import { Msg } from './msg';
import { init, update } from './update';

export function useAdminStore() {
    const [model, setModel] = useState<Model>(init);

    const dispatch = useCallback((msg: Msg) => {
        setModel(currentModel => update(currentModel, msg));
    }, []);

    return {
        model,
        dispatch,
    };
}

// Selectors
export const selectModel = (state: { model: Model }) => state.model;
export const selectDispatch = (state: { dispatch: (msg: Msg) => void }) => state.dispatch;
