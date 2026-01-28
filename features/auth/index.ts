// Auth feature exports - TEA-based authentication module
export { useAuth } from './hooks/use_auth';
export { useAuthStore, selectAuthModel, selectAuthDispatch, selectIsAuthenticated, selectCurrentUser, selectAuthError, selectAuthLoading } from './store/store';
export type { AuthModel, AuthMsg, AuthMsgType, User } from './store/types';
export type { UserRole } from '../../data/mock_data';
