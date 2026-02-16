import { EventDescriptor, EventHandler, globalEventRegistry } from './core/events';
import { logger } from './utils/logger';

const log = logger.withTag('RN_EVENTS');

export const BeforeRemove: EventDescriptor = {
    type: 'navigation.beforeRemove',
    platform: 'react-native',
    eventName: 'beforeRemove'
};

export const Focus: EventDescriptor = {
    type: 'navigation.focus',
    platform: 'react-native',
    eventName: 'focus'
};

export const Blur: EventDescriptor = {
    type: 'navigation.blur',
    platform: 'react-native',
    eventName: 'blur'
};

export const NavigationState: EventDescriptor = {
    type: 'navigation.state',
    platform: 'react-native',
    eventName: 'state'
};

export const ReactNativeNavigationHandler: EventHandler = {
    subscribe(target: any, handler: (event: any) => void) {
        if (!target || !target.addListener) {
            log.warn('ReactNativeNavigationHandler: target no válido para suscripción', { target });
            return () => { };
        }

        try {
            const unsubscribe = target.addListener('beforeRemove', handler);
            return () => {
                try {
                    unsubscribe();
                } catch (error) {
                    log.warn('Error al desuscribirse de beforeRemove', { error });
                }
            };
        } catch (error) {
            log.warn('Error al suscribirse a beforeRemove', { error });
            return () => { };
        }
    }
};

export const ReactNativeFocusHandler: EventHandler = {
    subscribe(target: any, handler: (event: any) => void) {
        if (!target || !target.addListener) {
            log.warn('ReactNativeFocusHandler: target no válido para suscripción', { target });
            return () => { };
        }

        try {
            const unsubscribe = target.addListener('focus', handler);
            return () => {
                try {
                    unsubscribe();
                } catch (error) {
                    log.warn('Error al desuscribirse de focus', { error });
                }
            };
        } catch (error) {
            log.warn('Error al suscribirse a focus', { error });
            return () => { };
        }
    }
};

export const ReactNativeBlurHandler: EventHandler = {
    subscribe(target: any, handler: (event: any) => void) {
        if (!target || !target.addListener) {
            log.warn('ReactNativeBlurHandler: target no válido para suscripción', { target });
            return () => { };
        }

        try {
            const unsubscribe = target.addListener('blur', handler);
            return () => {
                try {
                    unsubscribe();
                } catch (error) {
                    log.warn('Error al desuscribirse de blur', { error });
                }
            };
        } catch (error) {
            log.warn('Error al suscribirse a blur', { error });
            return () => { };
        }
    }
};

export const ReactNativeNavigationStateHandler: EventHandler = {
    subscribe(target: any, handler: (event: any) => void) {
        if (!target || !target.addListener) {
            return () => { };
        }
        try {
            const unsubscribe = target.addListener('state', () => {
                handler(target);
            });
            return () => {
                try {
                    unsubscribe();
                } catch (error) {
                    log.warn('Error al desuscribirse de state', { error });
                }
            };
        } catch (error) {
            return () => { };
        }
    }
};

export function registerReactNativeEvents(): void {
    globalEventRegistry.register(BeforeRemove, ReactNativeNavigationHandler);
    globalEventRegistry.register(Focus, ReactNativeFocusHandler);
    globalEventRegistry.register(Blur, ReactNativeBlurHandler);
    globalEventRegistry.register(NavigationState, ReactNativeNavigationStateHandler);
}