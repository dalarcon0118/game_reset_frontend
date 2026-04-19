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
        /**
         * EFFECT handler - Ejecuta efectos custom con constructor de mensajes.
         * El handler registrado debe retornar un Task o Promise.
         * El resultado se mapea a un Msg vía onSuccess/onFailure.
         */
        EFFECT: async (payload: { effectType: string; payload: any; onSuccess: (r: any) => any; onFailure: (e: any) => any; label?: string }, dispatch: (msg: any) => void) => {
            if (!payload || typeof payload.effectType !== 'string' || !payload.effectType) {
                console.error(`[EFFECT] ❌ Invalid effectType in payload`, {
                    effectType: payload?.effectType,
                    payloadType: typeof payload,
                    fullPayload: payload
                });
                const msg = payload?.onFailure?.(new Error(`Invalid effectType: ${payload?.effectType}`));
                if (msg) dispatch(msg);
                return;
            }
            
            const { effectType, payload: effectPayload, onSuccess, onFailure, label } = payload;
            const handler = EffectRegistry.get(effectType);

            if (!handler) {
                console.error(`[EFFECT] ❌ Handler not found: ${effectType}`);
                const msg = onFailure(new Error(`Effect handler not found: ${effectType}`));
                if (msg) dispatch(msg);
                return;
            }

            try {
                console.log(`[EFFECT] Executing: ${effectType}`, { label });
                // El handler retorna Task o Promise. Task tiene .fork(), Promise no.
                const result: any = await handler(effectPayload, dispatch);
                // Si el resultado es un Task (tiene fork), ejecutarlo
                const value = result?.fork ? await result.fork() : result;
                const msg = onSuccess(value);
                if (msg) dispatch(msg);
            } catch (error) {
                console.error(`[EFFECT] Failed: ${effectType}`, error);
                const msg = onFailure(error);
                if (msg) dispatch(msg);
            }
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
            
            // Validación defensiva: capturar keys inválidas
            if (key === 'undefined' || key === 'null' || key === '') {
                const errorMsg = `[EFFECT_HANDLER] ❌ Invalid handler key: "${key}" (type: ${typeof prop})`;
                console.error(errorMsg, {
                    prop,
                    propType: typeof prop,
                    stack: new Error().stack
                });
                return async (payload: any, dispatch: (msg: any) => void) => {
                    return Promise.reject(new Error(errorMsg));
                };
            }

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
        ownKeys: (_) => {
            return ['MSG', 'HTTP', 'TASK', 'NAVIGATE', 'ALERT'];
        },
        getOwnPropertyDescriptor: (_, prop) => ({
            enumerable: true,
            configurable: true,
        }),
    }
);
