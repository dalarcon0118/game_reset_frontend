import { TeaMiddleware } from '../middleware.types';
import { logger } from '@/shared/utils/logger';
import { LogCategory } from '@/shared/utils/logger.types';

const baseLog = logger.withTag('TEA');

const getCategory = (msgType: string): LogCategory => {
    if (msgType.includes('TICK') || msgType.includes('HEARTBEAT') || msgType.includes('POLLING')) return 'INFRA';
    if (msgType.includes('FETCH') || msgType.includes('RECEIVE') || msgType.includes('API')) return 'NETWORK';
    if (msgType.includes('UI') || msgType.includes('CLICK') || msgType.includes('PRESS')) return 'UI';
    return 'BUSINESS';
};

export const createLoggerMiddleware = <Model, Msg>(storeId?: string): TeaMiddleware<Model, Msg> => {
    return {
        id: 'logger-middleware',
        beforeUpdate: (model, msg, meta) => {
            if (__DEV__) {
                const msgType = (msg as any)?.type || 'UNKNOWN';
                const category = getCategory(msgType);

                // Silenciar logs de INFRA muy ruidosos si no estamos en modo ultra-debug
                if (category === 'INFRA') return;

                const log = baseLog.withContext({
                    category,
                    traceId: meta.traceId,
                    storeId: storeId || 'GLOBAL',
                    importance: msgType.includes('ERROR') || msgType.includes('SUBMIT') ? 'HIGH' : 'LOW'
                });

                log.groupCollapsed(`⚡ ${msgType}`, msg);
                //log.debug('⏪ Prev State:', model);
            }
        },
        afterUpdate: (_prevModel, msg, nextModel, cmd, meta) => {
            if (__DEV__) {
                const msgType = (msg as any)?.type || 'UNKNOWN';
                const category = getCategory(msgType);
                if (category === 'INFRA') return;

                const log = baseLog.withContext({
                    category,
                    traceId: meta.traceId,
                    storeId: storeId || 'GLOBAL'
                });

                // log.debug('⏩ Next State:', nextModel);

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
                    traceId: meta.traceId,
                    storeId: storeId || 'GLOBAL'
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
                    traceId: meta.traceId,
                    storeId: storeId || 'GLOBAL'
                });
                log.debug(`⚙️ Executing Cmd: ${cmd.type}`, cmd.payload);
            }
        }
    };
};
