import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '@/data/mockData';
import { useDataFetch } from '@/shared/hooks/useDataFetch';
import { LoginService } from '@/shared/services/auth/LoginService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<any>;
  logout: () => Promise<any>;
  checkLoginStatus: () => Promise<any>;
  error: any;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => false,
  logout: async () => {},
  checkLoginStatus: async () => {},
  isLoading: false,
  error: null
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const loginService = LoginService();
  const [login, loginData, loginLoading, loginError] = useDataFetch(loginService.login);
  const [checkLoginStatus, userData, statusLoading] = useDataFetch(loginService.checkLoginStatus);
  const [logout] = useDataFetch(loginService.logout);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle login data changes
  useEffect(() => {
    console.log("loginData: ", loginData);
    if (loginData) {
      setUser(loginData);
    }
  }, [loginData]);

  // Handle user data changes from status check
  useEffect(() => {
    console.log("userData: ", userData);
    if (userData) {
      setUser(userData);
    }
  }, [userData]);

  // Combined loading state
  useEffect(() => {
    setIsLoading(loginLoading || statusLoading);
  }, [loginLoading, statusLoading]);

  // Initial status check
  useEffect(() => {
    checkLoginStatus();
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      checkLoginStatus,
      isAuthenticated: user !== null,
      user,
      login,
      logout: handleLogout,
      error: loginError,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}