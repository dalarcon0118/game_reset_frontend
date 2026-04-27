import { TeaMiddleware } from '../tea-utils/middleware.types';

export const createTestMiddleware = <TModel, TMsg>(): {
    middleware: TeaMiddleware<TModel, TMsg>;
    waitForMsg: (predicate: (msg: TMsg) => boolean, timeout?: number) => Promise<TMsg>;
    waitForEffect: (predicate: (cmd: unknown) => boolean, timeout?: number) => Promise<unknown>;
    getHistory: () => { msg: TMsg, model: TModel, cmd: unknown }[];
} => {
    const history: { msg: TMsg, model: TModel, cmd: unknown }[] = [];
    const msgWaiters: { check: (msg: TMsg) => boolean, resolve: (msg: TMsg) => void }[] = [];
    const effectWaiters: { check: (cmd: unknown) => boolean, resolve: (cmd: unknown) => void }[] = [];

    const middleware: TeaMiddleware<TModel, TMsg> = {
        beforeUpdate: (model, msg) => {
            // Check msg waiters BEFORE update happens to catch it early if needed
            // But usually we wait for AFTER update to confirm it was processed
        },
        afterUpdate: (prevModel, msg, nextModel, cmd) => {
            history.push({ msg, model: nextModel, cmd });
            
            // Notify Message Waiters
            const satisfiedMsgWaiters = msgWaiters.filter(w => w.check(msg));
            satisfiedMsgWaiters.forEach(w => w.resolve(msg));
            
            // Remove satisfied waiters
            for (let i = msgWaiters.length - 1; i >= 0; i--) {
                if (msgWaiters[i].check(msg)) {
                    msgWaiters.splice(i, 1);
                }
            }

            // Notify Effect Waiters
            if (cmd) {
                const cmdList = Array.isArray(cmd) ? cmd : [cmd];
                cmdList.forEach(c => {
                    const satisfiedEffectWaiters = effectWaiters.filter(w => w.check(c));
                    satisfiedEffectWaiters.forEach(w => w.resolve(c));
                });
                
                // Remove satisfied waiters
                for (let i = effectWaiters.length - 1; i >= 0; i--) {
                    if (cmdList.some(c => effectWaiters[i].check(c))) {
                        effectWaiters.splice(i, 1);
                    }
                }
            }
        }
    };

    return {
        middleware,
        waitForMsg: (predicate, timeout = 1000) => {
            return new Promise((resolve, reject) => {
                // 1. Check history first
                const found = history.find(h => predicate(h.msg));
                if (found) return resolve(found.msg);

                // 2. Wait for future
                const timer = setTimeout(() => {
                    const index = msgWaiters.findIndex(w => w.check === predicate);
                    if (index !== -1) msgWaiters.splice(index, 1);
                    reject(new Error(`Timeout waiting for message matching predicate`));
                }, timeout);

                msgWaiters.push({
                    check: predicate,
                    resolve: (m) => { clearTimeout(timer); resolve(m); }
                });
            });
        },
        waitForEffect: (predicate, timeout = 1000) => {
            return new Promise((resolve, reject) => {
                // 1. Check history first
                const found = history.flatMap(h => Array.isArray(h.cmd) ? h.cmd : [h.cmd]).find(c => c && predicate(c));
                if (found) return resolve(found);

                // 2. Wait for future
                const timer = setTimeout(() => {
                    const index = effectWaiters.findIndex(w => w.check === predicate);
                    if (index !== -1) effectWaiters.splice(index, 1);
                    reject(new Error(`Timeout waiting for effect matching predicate`));
                }, timeout);

                effectWaiters.push({
                    check: predicate,
                    resolve: (c) => { clearTimeout(timer); resolve(c); }
                });
            });
        },
        getHistory: () => history
    };
};
