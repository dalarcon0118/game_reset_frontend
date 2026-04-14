import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { RewardState } from './types';
import { initialRewardState } from './model';
import { rewardReducer, RewardUpdate } from './update';

interface RewardContextType {
  state: RewardState;
  dispatch: React.Dispatch<RewardUpdate>;
}

const RewardContext = createContext<RewardContextType | undefined>(undefined);

interface RewardProviderProps {
  children: ReactNode;
  initialState?: RewardState;
}

export const RewardProvider: React.FC<RewardProviderProps> = ({ 
  children, 
  initialState = initialRewardState 
}) => {
  const [state, dispatch] = useReducer(rewardReducer, initialState);

  return (
    <RewardContext.Provider value={{ state, dispatch }}>
      {children}
    </RewardContext.Provider>
  );
};

export const useRewardContext = (): RewardContextType => {
  const context = useContext(RewardContext);
  if (!context) {
    throw new Error('useRewardContext must be used within a RewardProvider');
  }
  return context;
};
