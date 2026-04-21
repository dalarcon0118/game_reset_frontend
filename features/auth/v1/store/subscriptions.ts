import { LoginModel } from './model';
import { LoginMsg, RESET_LOGIN_UI } from './msg';
import { Sub, SubDescriptor } from '@core/tea-utils/sub';
import { AuthModuleV1 } from '../adapters/auth_provider';
import { AuthStatus, AuthModel } from '@/shared/auth/v1/model';

interface AuthStoreState {
    model: AuthModel;
}

/**
 * Login Subscriptions
 * Centraliza la observación de cambios en modelos externos (NO el propio).
 *
 * NOTA: La lógica de trigger de login se maneja en el update (update.ts)
 * siguiendo el patrón de Elm. Las suscripciones solo observan stores externos.
 *
 * ⚠️ IMPORTANTE: El selector debe retornar un valor PRIMITIVO, no un objeto nuevo.
 * Esto evita re-renders innecesarios causados por comparaciones de referencia.
 */
export const subscriptions = (model: LoginModel): SubDescriptor<LoginMsg> => {
    return Sub.batch([
        // Reset de UI cuando la sesión se cierra (AuthModuleV1 -> LoginModule)
        // Esta suscripción es correcta: observa un store EXTERNO
        // ⚠️ Selector retorna valor primitivo (state.status) para evitar re-renders
        Sub.watchStore(
            AuthModuleV1.name,
            (state: AuthModel) => state.status,  // ✅ Retorna primitivo directamente
            (status) => {
                // Si la sesión se fechou y tenemos un PIN en proceso, reseteamos la UI
                if (status === AuthStatus.UNAUTHENTICATED && model.pin.length > 0) {
                    return RESET_LOGIN_UI();
                }
                return null as any;
            },
            'login_ui_auth_sync'
        )
    ]);
};
