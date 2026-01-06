// Auth feature exports - TEA-based authentication module
export { useAuth } from './hooks/useAuth';
export { useAuthStore, selectAuthModel, selectAuthDispatch, selectIsAuthenticated, selectCurrentUser, selectAuthError, selectAuthLoading } from './store/store';
export type { AuthModel, AuthMsg, AuthMsgType, User } from './store/types';
export type { UserRole } from '../../data/mockData';
