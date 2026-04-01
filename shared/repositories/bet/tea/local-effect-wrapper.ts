import { logger } from '@/shared/utils/logger';

const log = logger.withTag('LocalEffectWrapper');

/**
 * Envuelve los manejadores de efectos locales para interceptar el tipo "EFFECT".
 * Esto permite que el repositorio maneje comandos Cmd.effect(...) internamente
 * sin depender del EffectRegistry global y evitando condiciones de carrera
 * en la inicialización de la aplicación.
 */
export const wrapLocalEffectHandlers = (baseHandlers: Record<string, any>) => {
    return {
        ...baseHandlers,
        EFFECT: async (
            payload: { effectType: string; payload: any; onSuccess: (r: any) => any; onFailure: (e: any) => any },
            dispatch: (msg: any) => void
        ) => {
            const { effectType, payload: effectPayload, onSuccess, onFailure } = payload;
            const handler = baseHandlers[effectType];
            
            if (!handler) {
                log.error(`Local handler not found for: ${effectType}`);
                const msg = onFailure(new Error(`Handler not found: ${effectType}`));
                if (msg) dispatch(msg);
                return;
            }

            try {
                log.info(`Executing local effect: ${effectType}`);
                const result: any = await handler(effectPayload);
                const value = result?.fork ? await result.fork() : result;
                const msg = onSuccess(value);
                if (msg) dispatch(msg);
            } catch (error) {
                log.error(`Effect failed: ${effectType}`, error);
                const msg = onFailure(error);
                if (msg) dispatch(msg);
            }
        }
    };
};
