import { createTEAModule } from '@core/engine/tea_module';
import { AuthServiceV1 } from '@/shared/auth/v1';
import { AuthModel } from '@/shared/auth/v1/model';
import { AuthMsg } from '@/shared/auth/v1/msg';

/**
 * AuthModuleV1
 * Instancia del módulo TEA para Autenticación.
 * Gestiona el ciclo de vida del store dentro de React para evitar singletons.
 */
export const AuthModuleV1 = createTEAModule<AuthModel, AuthMsg>({
    name: 'AuthModuleV1',
    initial: AuthServiceV1.initial,
    update: AuthServiceV1.update,
    subscriptions: AuthServiceV1.subscriptions
});

export const AuthProviderV1 = AuthModuleV1.Provider;
