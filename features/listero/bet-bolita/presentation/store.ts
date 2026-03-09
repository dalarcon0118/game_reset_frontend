import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { UseBoundStore, StoreApi } from 'zustand';
import { createElmStore } from '@/shared/core/engine/engine';
import { Cmd, Sub } from '@/shared/core/tea-utils';
import { BolitaModel } from '../domain/models/bolita.types';
import { initialBolitaModel } from '../domain/models/bolita.initial';
import { update } from '../application/bolita';
import { BolitaMsg } from '../domain/models/bolita.messages';

/**
 * 🏪 BOLITA STORE
 * 
 * TEA Engine instance for Bolita feature.
 * Connects Application (Update/Flows) with Domain (Model/Messages).
 * Following the TEA Clean Feature Design.
 */
const init = (params?: Partial<BolitaModel>): [BolitaModel, Cmd] => {
    return [
        { ...initialBolitaModel, ...params },
        Cmd.none
    ];
};

const subscriptions = (model: BolitaModel) => Sub.none();

interface StoreState {
    model: BolitaModel;
    dispatch: (msg: BolitaMsg) => void;
    init: (params?: any) => void;
    cleanup: () => void;
}

type StoreType = UseBoundStore<StoreApi<StoreState>>;

const BolitaStoreContext = createContext<StoreType | undefined>(undefined);

const createBolitaStore = () => {
    return createElmStore<BolitaModel, BolitaMsg>({
        initial: init,
        update: update,
        subscriptions
    });
};

export const BolitaStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const store = useMemo(() => createBolitaStore(), []);

    useEffect(() => {
        return () => {
            store.getState().cleanup();
        };
    }, [store]);

    return React.createElement(
        BolitaStoreContext.Provider,
        { value: store },
        children
    );
};

export function useBolitaStore(): StoreState;
export function useBolitaStore<T>(selector: (state: StoreState) => T): T;
export function useBolitaStore<T>(selector?: (state: StoreState) => T): T | StoreState {
    const store = useContext(BolitaStoreContext);
    if (!store) {
        throw new Error('useBolitaStore must be used within a BolitaStoreProvider');
    }

    if (!selector) {
        return store();
    }

    return store(selector);
}

export const selectBolitaModel = (state: StoreState) => state.model;
export const selectDispatch = (state: StoreState) => state.dispatch;
