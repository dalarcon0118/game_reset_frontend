import { Sub, SubDescriptor } from '@/shared/core/tea-utils';
import { useAuthStore } from './store/store';
import { SubscriptionHandler } from '@/shared/core/architecture/kernel';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('AUTH_SUB_HANDLER');

/**
 * Handler universal para suscripciones de autenticación.
 * Permite a los features escuchar cambios en el usuario autenticado
 * sin acoplarse directamente al store de autenticación.
 */
export const AuthSubscriptionHandler: SubscriptionHandler = {
    id: 'AUTH_SYNC',
    createSubscription: (params: {
        msgCreator: (user: any) => any,
        selector?: (state: any) => any,
        id?: string
    }) => {
        log.debug('Creating subscription', { id: params.id });

        // Selector por defecto: obtener el usuario del modelo
        const defaultSelector = (state: any) => state.model?.user ?? state.user;
        const selector = params.selector || defaultSelector;

        // Usamos un ID derivado si no se proporciona uno
        const subId = params.id || 'kernel-auth-sync';

        return Sub.watchStore(
            useAuthStore,
            selector,
            params.msgCreator,
            subId
        );
    }
};
