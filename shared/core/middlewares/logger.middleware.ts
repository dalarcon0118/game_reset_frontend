import { TeaMiddleware } from '../tea-utils/middleware.types';
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
    beforeUpdate: (model: Model, msg: Msg, meta: Record<string, unknown>) => {
      if (__DEV__) {
        const msgType = (msg as { type?: string })?.type || 'UNKNOWN';
        const category = getCategory(msgType);
        if (category === 'INFRA') return;

        const log = baseLog.withContext({
          category,
          traceId: meta.traceId,
          storeId: storeId || 'GLOBAL',
          importance: msgType.includes('ERROR') || msgType.includes('SUBMIT') ? 'HIGH' : 'LOW'
        });
        log.groupCollapsed(`⚡ ${msgType}`, msg);
      }
    },
    afterUpdate: (_prevModel: Model, msg: Msg, _nextModel: Model, cmd: unknown, meta: Record<string, unknown>) => {
      if (__DEV__) {
        const msgType = (msg as { type?: string })?.type || 'UNKNOWN';
        const category = getCategory(msgType);
        if (category === 'INFRA') return;

        const log = baseLog.withContext({
          category,
          traceId: meta.traceId,
          storeId: storeId || 'GLOBAL'
        });
        if (cmd) {
          const formatCmd = (c: unknown): unknown => {
            if (!c) return 'null';
            if (Array.isArray(c)) return c.map(formatCmd);
            const cmdObj = c as { label?: string; type?: string; payload?: unknown };
            const label = cmdObj.label || cmdObj.type || 'Unknown Cmd';
            const details = cmdObj.payload ? cmdObj.payload : (cmdObj.label ? cmdObj : '');
            return { label, details };
          };
          log.debug('🚀 Side Effects:', formatCmd(cmd));
        }
        log.groupEnd();
      }
    },
    onUpdateError: (model: Model, msg: Msg, error: unknown, meta: Record<string, unknown>) => {
      if (__DEV__) {
        const msgType = (msg as { type?: string })?.type || 'UNKNOWN';
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
    beforeCmd: (cmd: unknown, meta: Record<string, unknown>) => {
      if (__DEV__) {
        const log = baseLog.withContext({
          category: 'INFRA',
          traceId: meta.traceId,
          storeId: storeId || 'GLOBAL'
        });
        const cmdObj = cmd as { type?: string; payload?: unknown } | null;
        const cmdType = (cmdObj && typeof cmdObj === 'object') ? cmdObj.type : 'INVALID';
        const cmdPayload = cmdObj?.payload;
        log.debug(`⚙️ Executing Cmd: ${cmdType}`, { rawCmd: cmd, payload: cmdPayload });
      }
    }
  };
};