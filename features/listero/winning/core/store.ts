import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { WinningState } from './types';
import { initialWinningState } from './model';
import { winningReducer, WinningUpdate } from './update';

interface WinningContextType {
  state: WinningState;
  dispatch: React.Dispatch<WinningUpdate>;
}

const WinningContext = createContext<WinningContextType | undefined>(undefined);

interface WinningProviderProps {
  children: ReactNode;
  initialState?: WinningState;
}

export const WinningProvider: React.FC<WinningProviderProps> = ({ 
  children, 
  initialState = initialWinningState 
}) => {
  const [state, dispatch] = useReducer(winningReducer, initialState);

  return (
    <WinningContext.Provider value={{ state, dispatch }}>
      {children}
    </WinningContext.Provider>
  );
};

export const useWinningContext = (): WinningContextType => {
  const context = useContext(WinningContext);
  if (!context) {
    throw new Error('useWinningContext must be used within a WinningProvider');
  }
  return context;
};
