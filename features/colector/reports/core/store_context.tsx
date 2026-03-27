import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { UseBoundStore, StoreApi } from 'zustand';
import { createElmStore } from '@core/engine/engine';
import { initialModel, Model } from './model';
import { Msg } from './msg';
import { update } from './update';

interface StoreState {
  model: Model;
  dispatch: (msg: Msg) => void;
  init: (params?: any) => void;
  cleanup: () => void;
}

type StoreType = UseBoundStore<StoreApi<StoreState>>;
const ColectorReportsFormContext = createContext<StoreType | undefined>(undefined);

const createReportsFormStore = () =>
  createElmStore<Model, Msg>({
    initial: initialModel,
    update,
  });

export const ColectorReportsFormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useMemo(() => createReportsFormStore(), []);

  useEffect(() => {
    return () => {
      store.getState().cleanup();
    };
  }, [store]);

  return <ColectorReportsFormContext.Provider value={store}>{children}</ColectorReportsFormContext.Provider>;
};

export function useReportsFormStore(): StoreState;
export function useReportsFormStore<T>(selector: (state: StoreState) => T): T;
export function useReportsFormStore<T>(selector?: (state: StoreState) => T): T | StoreState {
  const store = useContext(ColectorReportsFormContext);
  if (!store) throw new Error('useReportsFormStore must be used within a ColectorReportsFormProvider');
  if (!selector) return store();
  return store(selector);
}
