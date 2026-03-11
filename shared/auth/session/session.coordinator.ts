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
    private refreshTimeout: NodeJS.Timeout | null = null;
    private isExiting = false; // Local flag to prevent multiple exit signals during race conditions
    private isHydrating = false; // Flag to prevent expiration signals during hydration
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
        this.isHydrating = true; // Block expiration signals during hydration

        try {
            // Reintento de hidratación para evitar race conditions con el almacenamiento persistente tras un login
            let user = await this.authRepo.getUserIdentity();
            let { access } = await this.authRepo.getToken();

            if (!user && access) {
                this.log.warn('Access token found but no user identity, retrying hydration in 500ms...');
                await new Promise(resolve => setTimeout(resolve, 500));
                user = await this.authRepo.getUserIdentity();
                const tokenData = await this.authRepo.getToken();
                access = tokenData.access;
            }

            const tokenState = SessionPolicy.resolveTokenState(access);

            if (user && (tokenState === TokenState.VALID || tokenState === TokenState.EXPIRED || tokenState === TokenState.OFFLINE_MARKER)) {
                this.log.info('Session restored', { user: user.username, tokenState });
                this.isExiting = false; // Reset exit flag on successful hydration
                this.bus.publish({ type: SessionSignalType.SESSION_HYDRATED, payload: { user, tokenState } });
            } else {
                this.log.info('No valid session found during hydration');
                this.isExiting = false; // Reset flag anyway
                this.bus.publish({ type: SessionSignalType.SESSION_HYDRATED, payload: { user: null, tokenState: TokenState.ABSENT } });
            }
        } catch (error) {
            this.log.error('Error during hydration', error);
            this.isExiting = false;
            this.bus.publish({ type: SessionSignalType.SESSION_HYDRATED, payload: { user: null, tokenState: TokenState.ABSENT } });
        } finally {
            this.isHydrating = false; // Release the lock
        }
    }

    /**
     * Evalúa si un request requiere refresh preventivo.
     */
    async onRequestAuthCheck(
        endpoint: string,
        isPublic: boolean,
        networkConnected: boolean,
        refreshAction: () => Promise<string | null>
    ): Promise<void> {
        // 1. Guard contra refrescos concurrentes
        if (this.isRefreshing) {
            this.log.debug('Preventive refresh already in progress, skipping check', { endpoint });
            return;
        }

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

            // 2. Safety lock contra bucles infinitos (timeout de 10s)
            this.isRefreshing = true;
            this.refreshTimeout = setTimeout(() => {
                this.log.warn('Preventive refresh timeout exceeded, resetting isRefreshing flag');
                this.isRefreshing = false;
                this.refreshTimeout = null;
            }, 10000);

            try {
                await this.runPreventiveRefresh(endpoint, refreshAction);
            } finally {
                if (this.refreshTimeout) {
                    clearTimeout(this.refreshTimeout);
                    this.refreshTimeout = null;
                }
                this.isRefreshing = false;
            }
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
        const currentStatus = this.getState();

        // Evitar disparar si ya estamos en un estado de salida o expirado para prevenir bucles de logout
        // O si estamos en proceso de hidratación para evitar race conditions al arrancar
        if (this.isExiting || this.isHydrating || ['EXPIRED', 'LOGGING_OUT', 'ANONYMOUS'].includes(currentStatus)) {
            this.log.debug('Ignoring session expired signal (already in exit state, hydrating or exiting)', {
                currentStatus,
                reason,
                isExiting: this.isExiting,
                isHydrating: this.isHydrating
            });
            return;
        }

        this.isExiting = true; // Mark that we are already handling the exit
        this.log.warn('Session expired signal triggered', { reason });
        this.bus.publish({ type: SessionSignalType.SESSION_EXPIRED, payload: { reason } });

        // El Store escuchará esta señal (vía sub) y cambiará a EXPIRED/ANONYMOUS
        // También disparará el LOGOUT_REQUESTED si es necesario
    }

    /**
     * Resets the exit flag. Useful when a new login is started or successful.
     */
    public resetExitFlag(): void {
        this.isExiting = false;
    }

    private async runPreventiveRefresh(endpoint: string, refreshAction: () => Promise<string | null>): Promise<void> {
        if (this.refreshPromise) {
            await this.refreshPromise;
            return;
        }

        this.isRefreshing = true;
        this.refreshPromise = (async () => {
            try {
                const token = await refreshAction();
                if (token) {
                    this.bus.publish({ type: SessionSignalType.TOKEN_REFRESHED, payload: { token, endpoint } });
                    return token;
                }
                this.handleSessionExpired('REFRESH_FAILED');
                return null;
            } catch (error) {
                this.log.error('Preventive refresh failed', { endpoint, error });
                this.handleSessionExpired('REFRESH_FAILED');
                return null;
            } finally {
                this.isRefreshing = false;
                this.refreshPromise = null;
            }
        })();

        await this.refreshPromise;
    }

    private isPublicEndpoint(endpoint: string): boolean {
        const publicEndpoints = this.settings.api.endpoints.public || [];
        return publicEndpoints.some(p => endpoint.includes(p)) ||
            endpoint.includes('/login') ||
            endpoint.includes('/token');
    }
}
