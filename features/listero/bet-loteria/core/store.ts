import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { UseBoundStore, StoreApi } from 'zustand';
import { createElmStore } from '@core/engine/engine';
import { Cmd, Sub } from '@core/tea-utils';
import { updateFeature } from './feature.update';
import { LoteriaFeatureModel, FeatureMsg } from './feature.types';
import { initialModel } from './feature.initial';

// ============================================================================
// Initial Model (Re-exported from feature.initial to break circular dependency)
// ============================================================================

export { initialModel } from './feature.initial';

const init = (params?: Partial<LoteriaFeatureModel>): [LoteriaFeatureModel, Cmd] => {
    return [
        { ...initialModel, ...params },
        Cmd.none
    ];
};

const update = (model: LoteriaFeatureModel, msg: FeatureMsg) => updateFeature(model, msg);

const subscriptions = (_model: LoteriaFeatureModel) => Sub.none();

interface StoreState {
    model: LoteriaFeatureModel;
    dispatch: (msg: FeatureMsg) => void;
    init: (params?: any) => void;
    cleanup: () => void;
}

type StoreType = UseBoundStore<StoreApi<StoreState>>;

const LoteriaStoreContext = createContext<StoreType | undefined>(undefined);

const createLoteriaStore = () => {
    return createElmStore<LoteriaFeatureModel, FeatureMsg>({
        initial: init,
        update: update,
        subscriptions
    });
};

export const LoteriaStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const store = useMemo(() => createLoteriaStore(), []);

    useEffect(() => {
        return () => {
            store.getState().cleanup();
        };
    }, [store]);

    return React.createElement(
        LoteriaStoreContext.Provider,
        { value: store },
        children
    );
};

export function useLoteriaStore(): StoreState;
export function useLoteriaStore<T>(selector: (state: StoreState) => T): T;
export function useLoteriaStore<T>(selector?: (state: StoreState) => T): T | StoreState {
    const store = useContext(LoteriaStoreContext);
    if (!store) {
        throw new Error('useLoteriaStore must be used within a LoteriaStoreProvider');
    }

    if (!selector) {
        return store();
    }

    return store(selector);
}

export const selectLoteriaModel = (state: StoreState) => state.model;
export const selectDispatch = (state: StoreState) => state.dispatch;
