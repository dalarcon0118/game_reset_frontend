export { LoginModule, useLoginStore } from '../v1/store';
export { AuthProvider, useAuth } from '@/shared/context/auth_context';
export { AuthMsg, AuthMsgType } from './types/messages.types';

export interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'colector' | 'lister';
}

export interface AuthState {
  user: AuthUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  error: string | null;
}

export const selectIsAuthenticated = (state: AuthState) => state.status === 'authenticated';
export const selectIsLoading = (state: AuthState) => state.status === 'loading';
export const selectCurrentUser = (state: AuthState) => state.user;
export const selectAuthError = (state: AuthState) => state.error;
export const selectAuthDispatch = (state: AuthState) => (msg: AuthMsg) => {
  console.log('Auth dispatch:', msg);
};

export const useAuthStore = () => ({ 
  user: null, 
  status: 'idle' as const, 
  error: null 
});