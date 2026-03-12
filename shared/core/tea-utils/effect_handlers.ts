// @ts-ignore
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { handleHttp, HttpPayload } from '../effects/http.effect';
import { handleNavigation, NavigationPayload } from '../effects/navigation.effect';
import { handleTask, TaskPayload } from '../effects/task.effect';
import { EffectRegistry, EffectModule } from './effect_registry';

/**
 * Módulos base del sistema que se registrarán automáticamente o vía bootstrap.
 * Se exportan para que el bootstrap pueda decidir cuándo y cómo registrarlos.
 */

export const CoreEffectsModule: EffectModule = {
    namespace: '', // Core effects often live at root for legacy compat
    handlers: {
        MSG: (payload: any, dispatch: (msg: any) => void) => {
            dispatch(payload);
            return payload;
        },
        HTTP: async (payload: HttpPayload) => {
            return await handleHttp(payload);
        },
        TASK: (payload: TaskPayload, dispatch: (cmd: any) => void) => handleTask(payload, dispatch),
        NAVIGATE: (payload: NavigationPayload, dispatch: (cmd: any) => void) =>
            handleNavigation(payload, dispatch, router),
        ALERT: (payload: any, dispatch: (msg: any) => void) => {
            const { title, message, buttons, options } = payload;
            return new Promise((resolve) => {
                Alert.alert(
                    title,
                    message,
                    buttons?.map((btn: any) => ({
                        text: btn.text,
                        style: btn.style,
                        onPress: () => {
                            if (btn.onPressMsg) {
                                dispatch(btn.onPressMsg);
                            }
                            resolve(btn.text);
                        },
                    })),
                    options
                );
            });
        },
    },
};

// Los módulos se registran explícitamente en el bootstrap de la aplicación.
// Pero para evitar condiciones de carrera con la inicialización de stores a nivel de módulo,
// los registramos aquí también como fallback o inicialización temprana.
EffectRegistry.register(CoreEffectsModule);

/**
 * Proxy dinámico para mantener la interfaz original `effectHandlers` que usa el Engine.
 * En lugar de ser un objeto estático, ahora delega al Registry.
 */
export const effectHandlers = new Proxy(
    {},
    {
        get: (_, prop) => {
            const key = String(prop);
            // Retornamos una función que al ejecutarse busque el handler en el registry
            return async (payload: any, dispatch: (msg: any) => void) => {
                const handler = EffectRegistry.get(key);
                if (handler) {
                    // Log minimalista pero informativo para depuración
                    console.log(`[EFFECT_HANDLER] ⚙️ Executing: ${key}`, {
                        label: payload?.label || 'unlabeled',
                        hasTask: typeof payload?.task === 'function'
                    });
                    return await handler(payload, dispatch);
                } else {
                    console.error(`[EFFECT_HANDLER] ❌ Handler not found: ${key}`);
                    return Promise.reject(new Error(`Effect handler not found: ${key}`));
                }
            };
        },
    }
);
