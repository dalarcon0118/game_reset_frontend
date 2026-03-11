import { createElmStore } from '../../core/tea/engine';
import { initialModel, AuthModel, AuthStatus, Tokens, User } from './model';
import { update } from './update';
import { AuthMsg } from './msg';
import { ElmStoreConfig } from '../../core/tea/types';

/**
 * AuthService Interface
 * Define el contrato público del servicio de autenticación.
 */
export interface AuthService {
    /** Inicia el proceso de hidratación de sesión */
    bootstrap: () => void;
    /** Solicita el cierre de sesión */
    logout: () => void;
    /** Notifica un error de autenticación (401/403) para activar recuperación */
    handleAuthError: (status: number, endpoint: string) => void;
    /** Obtiene el estado actual de la máquina de estados */
    getStatus: () => AuthStatus;
    /** Obtiene los tokens actuales */
    getTokens: () => Tokens | null;
    /** Obtiene el usuario autenticado */
    getUser: () => User | null;
    /** Envía un mensaje directamente al store (uso avanzado) */
    dispatch: (msg: AuthMsg) => void;
}

/**
 * createAuthService (Factory Pattern)
 * 
 * Crea una instancia aislada del servicio de autenticación.
 * Evita singletons globales y permite inyección de dependencias vía config.
 * 
 * @param config Configuración opcional para sobreescribir el comportamiento del store
 * @returns Instancia fresca de AuthService
 */
export const createAuthService = (
    config?: Partial<ElmStoreConfig<AuthModel, AuthMsg>>
): AuthService => {
    const store = createElmStore({
        id: 'auth_v1',
        initial: initialModel,
        update: update,
        ...config
    });

    // Fachada que delega al estado interno del store
    return {
        bootstrap: () => store.getState().dispatch({ type: 'BOOTSTRAP_STARTED' }),

        logout: () => store.getState().dispatch({ type: 'LOGOUT_REQUESTED' }),

        handleAuthError: (status: number, endpoint: string) =>
            store.getState().dispatch({ type: 'AUTH_ERROR_DETECTED', status, endpoint }),

        getStatus: () => store.getState().model.status,

        getTokens: () => store.getState().model.tokens,

        getUser: () => store.getState().model.user,
        dispatch: (msg: AuthMsg) => store.getState().dispatch(msg),
    };
};

// No exportamos una instancia por defecto para evitar singletons accidentales
