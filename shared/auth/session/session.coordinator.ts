import {
    SessionStatus,
    TokenState,
    SessionSignalType,
    SessionPolicyContext
} from './session.types';
import { SessionPolicy } from './session.policy';
import { SessionSignalBus } from './session.signal.bus';
import { IAuthRepository, ILogger, ISettings } from '../../services/api_client/api_client.types';
import { ApiClientError } from '../../services/api_client/api_client.errors';

/**
 * SessionCoordinator: Orquestador reactivo de la sesión.
 * Centraliza la toma de decisiones cross-layer y emite señales de cambio de estado.
 */
export class SessionCoordinator {
    private static instance: SessionCoordinator;
    private bus = SessionSignalBus.getInstance();
    private isRefreshing = false;
    private refreshPromise: Promise<string | null> | null = null;

    private constructor(
        private authRepo: IAuthRepository,
        private settings: ISettings,
        private log: ILogger,
        private getState: () => SessionStatus,
        private dispatch: (msg: any) => void
    ) {
        this.log = log.withTag ? log.withTag('SessionCoordinator') : log;
    }

    public static initialize(
        authRepo: IAuthRepository,
        settings: ISettings,
        log: ILogger,
        getState: () => SessionStatus,
        dispatch: (msg: any) => void
    ): SessionCoordinator {
        if (!SessionCoordinator.instance) {
            log.info('Initializing SessionCoordinator instance...', 'SESSION_COORDINATOR');
            SessionCoordinator.instance = new SessionCoordinator(authRepo, settings, log, getState, dispatch);
        }
        return SessionCoordinator.instance;
    }

    public static isInitialized(): boolean {
        return !!SessionCoordinator.instance;
    }

    public static getInstance(): SessionCoordinator {
        if (!SessionCoordinator.instance) {
            throw new Error('SessionCoordinator not initialized. Call SessionCoordinator.initialize() first.');
        }
        return SessionCoordinator.instance;
    }

    /**
     * Retorna el estado actual de la sesión.
     */
    public getCurrentStatus(): SessionStatus {
        return this.getState();
    }

    /**
     * Maneja la hidratación inicial de la app.
     */
    async hydrate(): Promise<void> {
        return this.onAppHydration();
    }

    /**
     * Maneja la hidratación inicial de la app.
     */
    async onAppHydration(): Promise<void> {
        this.log.info('Starting app hydration...');

        try {
            const user = await this.authRepo.getUserIdentity();
            const { access } = await this.authRepo.getToken();
            const tokenState = SessionPolicy.resolveTokenState(access);

            if (user && (tokenState === TokenState.VALID || tokenState === TokenState.EXPIRED || tokenState === TokenState.OFFLINE_MARKER)) {
                this.log.info('Session restored', { user: user.username, tokenState });
                this.bus.publish({ type: SessionSignalType.SESSION_HYDRATED, payload: { user, tokenState } });
            } else {
                this.log.info('No valid session found during hydration');
                this.bus.publish({ type: SessionSignalType.SESSION_HYDRATED, payload: { user: null, tokenState: TokenState.ABSENT } });
            }
        } catch (error) {
            this.log.error('Error during hydration', error);
            this.bus.publish({ type: SessionSignalType.SESSION_HYDRATED, payload: { user: null, tokenState: TokenState.ABSENT } });
        }
    }

    /**
     * Evalúa si un request requiere refresh preventivo.
     */
    async onRequestAuthCheck(endpoint: string, isPublic: boolean, networkConnected: boolean): Promise<void> {
        const { access } = await this.authRepo.getToken();
        const tokenState = SessionPolicy.resolveTokenState(access);
        const status = this.getState();

        const context: SessionPolicyContext = {
            status,
            tokenState,
            networkConnected,
            endpoint,
            isPublicEndpoint: isPublic
        };

        if (SessionPolicy.shouldAttemptRefresh(context)) {
            this.log.info('Preventive refresh required', { endpoint, tokenState });
            // Aquí se llamaría al provider para refrescar
            this.bus.publish({ type: SessionSignalType.TOKEN_REFRESHED, payload: { endpoint } });
        }
    }

    /**
     * Maneja errores de autenticación (401/403) detectados por el transporte.
     */
    async onAuthError(error: ApiClientError, endpoint: string): Promise<{ retry: boolean }> {
        const isPublic = this.isPublicEndpoint(endpoint);
        const status = this.getState();
        const { access } = await this.authRepo.getToken();
        const tokenState = SessionPolicy.resolveTokenState(access);

        const context: SessionPolicyContext = {
            status,
            tokenState,
            networkConnected: true, // Si hubo error 401, hay red
            endpoint,
            isPublicEndpoint: isPublic
        };

        this.log.warn('Auth error detected', { status: error.status, endpoint, sessionStatus: status });

        if (SessionPolicy.shouldForceLogout(context, error.status)) {
            this.log.error('Forcing logout due to auth error', { endpoint });
            this.handleSessionExpired('AUTH_ERROR');
            return { retry: false };
        }

        return { retry: false };
    }

    /**
     * Notifica la expiración de la sesión a todo el sistema.
     */
    handleSessionExpired(reason: string): void {
        this.log.warn('Session expired signal', { reason });
        this.bus.publish({ type: SessionSignalType.SESSION_EXPIRED, payload: { reason } });

        // El Store escuchará esta señal (vía sub) y cambiará a EXPIRED/ANONYMOUS
        // También disparará el LOGOUT_REQUESTED si es necesario
    }

    private isPublicEndpoint(endpoint: string): boolean {
        const publicEndpoints = this.settings.api.endpoints.public || [];
        return publicEndpoints.some(p => endpoint.includes(p)) ||
            endpoint.includes('/login') ||
            endpoint.includes('/token');
    }
}
