import React, { createContext, useContext, ReactNode } from 'react';
import { NavigationPolicy } from './navigation_policy.types';

interface NavigationConfig {
  policy: NavigationPolicy;
}

const NavigationConfigContext = createContext<NavigationConfig | null>(null);

export const NavigationConfigProvider: React.FC<{
  policy: NavigationPolicy;
  children: ReactNode;
}> = ({ policy, children }) => {
  return (
    <NavigationConfigContext.Provider value={{ policy }}>
      {children}
    </NavigationConfigContext.Provider>
  );
};

export const useNavigationConfig = () => {
  const context = useContext(NavigationConfigContext);
  if (!context) {
    throw new Error('useNavigationConfig must be used within a NavigationConfigProvider');
  }
  return context;
};
