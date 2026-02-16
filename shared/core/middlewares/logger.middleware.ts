import { TeaMiddleware } from '../middleware.types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('TEA_LOGGER');

export const createLoggerMiddleware = <Model, Msg>(): TeaMiddleware<Model, Msg> => {
    return {
        beforeUpdate: (model, msg) => {
            if (__DEV__) {
                const msgType = (msg as any)?.type || 'UNKNOWN';
                // 🔷 Action Header with Emoji
                log.groupCollapsed(`🔷 [TEA] ⚡ ${msgType}`, msg);
                log.debug('├─ ⏪ Prev:', model);
            }
        },
        afterUpdate: (prevModel, msg, nextModel, cmd) => {
            if (__DEV__) {
                log.debug('├─ ⏩ Next:', nextModel);

                if (cmd) {
                    const formatCmd = (c: any) => {
                        if (!c) return 'null';
                        if (Array.isArray(c)) return c.map(formatCmd);
                        // Try to extract readable info
                        const label = c.label || c.type || 'Unknown Cmd';
                        const payload = c.payload ? c.payload : (c.label ? c : '');
                        return { label, details: payload };
                    };

                    log.debug('└─ 🚀 Cmd:', formatCmd(cmd));
                } else {
                    log.debug('└─ 💤 No Side Effects');
                }

                log.groupEnd();
            }
        }
    };
};
