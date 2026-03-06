import { SessionPolicyContext, TokenState, SessionStatus } from './session.types';

/**
 * SessionPolicy: Reglas puras para la toma de decisiones de autenticación.
 * Esta clase NO realiza I/O, es 100% determinística y testeable.
 */
export class SessionPolicy {
    private static REFRESH_SKEW_SECONDS = 60; // Margen de seguridad para refresh

    /**
     * Determina el estado de un token JWT o marcador offline.
     */
    static resolveTokenState(token: string | null): TokenState {
        if (!token) return TokenState.ABSENT;
        if (token === 'offline-token') return TokenState.OFFLINE_MARKER;
        if (!token.includes('.')) return TokenState.INVALID;

        try {
            const payload = JSON.parse(this.atob(token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            
            if (payload.exp - now < this.REFRESH_SKEW_SECONDS) {
                return TokenState.EXPIRED;
            }
            return TokenState.VALID;
        } catch (e) {
            return TokenState.INVALID;
        }
    }

    /**
     * Determina si se debe intentar un refresh automático antes de un request.
     */
    static shouldAttemptRefresh(context: SessionPolicyContext): boolean {
        // Regla de Oro: Nunca intentar refresh si no hay token previo o es offline
        if (context.tokenState === TokenState.ABSENT || context.tokenState === TokenState.OFFLINE_MARKER) {
            return false;
        }

        // Solo intentar si el token está expirado y tenemos red
        if (context.tokenState === TokenState.EXPIRED && context.networkConnected) {
            return true;
        }

        return false;
    }

    /**
     * Determina si se debe adjuntar el header Authorization a un request.
     */
    static shouldAttachAuthorization(context: SessionPolicyContext): boolean {
        // No adjuntar si el endpoint es público explícitamente
        if (context.isPublicEndpoint) return false;

        // No adjuntar si el token es nulo o marcador offline
        if (context.tokenState === TokenState.ABSENT || context.tokenState === TokenState.OFFLINE_MARKER) {
            return false;
        }

        // Adjuntar solo si el token es válido o está expirado (para permitir refresh interceptor si falla)
        return context.tokenState === TokenState.VALID || context.tokenState === TokenState.EXPIRED;
    }

    /**
     * Determina si se debe reintentar un request tras un error de autenticación (401/403).
     */
    static shouldRetryAfterAuthError(context: SessionPolicyContext, refreshResult: 'SUCCESS' | 'FAILURE'): boolean {
        // Solo reintentar si el refresh fue exitoso y el endpoint no era de login/refresh
        return refreshResult === 'SUCCESS' && !context.isPublicEndpoint;
    }

    /**
     * Determina si se debe forzar el logout tras una falla de sesión.
     */
    static shouldForceLogout(context: SessionPolicyContext, errorStatus: number): boolean {
        // Forzar logout si recibimos 401 en un estado donde deberíamos estar autenticados
        // y el refresh ya falló o no es posible.
        return errorStatus === 401 && context.status !== 'ANONYMOUS';
    }

    /**
     * Fallback de atob para entornos React Native.
     */
    private static atob(input: string): string {
        try {
            // En React Native, 'atob' puede no estar disponible globalmente en producción
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
            let str = input.replace(/=+$/, '');
            let output = '';

            if (str.length % 4 === 1) throw new Error("'atob' failed");

            for (let bc = 0, bs = 0, buffer, i = 0; (buffer = str.charAt(i++)); ) {
                buffer = chars.indexOf(buffer);
                if (buffer === -1) continue;
                // eslint-disable-next-line no-bitwise
                bs = bc % 4 ? bs * 64 + buffer : buffer;
                // eslint-disable-next-line no-bitwise
                if (bc++ % 4) output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
            }

            return output;
        } catch (e) {
            return '';
        }
    }
}
