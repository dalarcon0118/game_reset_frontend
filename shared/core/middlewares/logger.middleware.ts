import { TeaMiddleware } from '../middleware.types';
import { logger, LogContext } from '@/shared/utils/logger';

const baseLog = logger.withTag('TEA');

const getCategory = (msgType: string): LogContext['category'] => {
    if (msgType.includes('TICK') || msgType.includes('HEARTBEAT') || msgType.includes('POLLING')) return 'INFRA';
    if (msgType.includes('FETCH') || msgType.includes('RECEIVE') || msgType.includes('API')) return 'NETWORK';
    if (msgType.includes('UI') || msgType.includes('CLICK') || msgType.includes('PRESS')) return 'UI';
    return 'BUSINESS';
};

export const createLoggerMiddleware = <Model, Msg>(storeId?: string): TeaMiddleware<Model, Msg> => {
    return {
        id: 'logger-middleware',
        beforeUpdate: (model, msg, meta) => {
            // Generar traceId lo antes posible para que esté disponible en toda la cadena
            // Incluso si es un mensaje de INFRA que no logueamos, sus comandos hijos heredarán este ID
            if (!meta.traceId) {
                meta.traceId = Math.random().toString(36).substring(2, 8).toUpperCase();
            }

            if (__DEV__) {
                const msgType = (msg as any)?.type || 'UNKNOWN';
                const category = getCategory(msgType);

                // Silenciar logs de INFRA muy ruidosos si no estamos en modo ultra-debug
                if (category === 'INFRA') return;

                const log = baseLog.withContext({
                    category,
                    traceId: meta.traceId,
                    importance: msgType.includes('ERROR') || msgType.includes('SUBMIT') ? 'HIGH' : 'LOW'
                });

                log.groupCollapsed(`⚡ ${msgType} [${storeId || 'GLOBAL'}]`, msg);
                log.debug('⏪ Prev State:', model);
            }
        },
        afterUpdate: (prevModel, msg, nextModel, cmd, meta) => {
            if (__DEV__) {
                const msgType = (msg as any)?.type || 'UNKNOWN';
                const category = getCategory(msgType);
                if (category === 'INFRA') return;

                const log = baseLog.withContext({ category, traceId: meta.traceId });

                log.debug('⏩ Next State:', nextModel);

                if (cmd) {
                    const formatCmd = (c: any): any => {
                        if (!c) return 'null';
                        if (Array.isArray(c)) return c.map(formatCmd);
                        const label = c.label || c.type || 'Unknown Cmd';
                        const details = c.payload ? c.payload : (c.label ? c : '');
                        return { label, details };
                    };

                    log.debug('🚀 Side Effects:', formatCmd(cmd));
                }

                log.groupEnd();
            }
        },
        onUpdateError: (model, msg, error, meta) => {
            if (__DEV__) {
                const msgType = (msg as any)?.type || 'UNKNOWN';
                const log = baseLog.withContext({
                    category: 'BUSINESS',
                    importance: 'HIGH',
                    traceId: meta.traceId
                });

                log.error(`❌ UPDATE FAILED: ${msgType}`, error);
                log.debug('💣 State at crash:', model);
                log.debug('📝 Message causing crash:', msg);
                log.groupEnd();
            }
        },
        beforeCmd: (cmd, meta) => {
            if (__DEV__) {
                const log = baseLog.withContext({
                    category: 'INFRA',
                    traceId: meta.traceId
                });
                log.debug(`⚙️ Executing Cmd: ${cmd.type}`, cmd.payload);
            }
        }
    };
};

