import { Result } from './algebraic-types';
import { Task } from './task';

/**
 * TaskRuntime - Orquestación de Efectos Asíncronos
 *
 * Responsabilidad única: coordinar, temporizar y reintentar Tasks.
 * NO contiene lógica monádica pura (eso vive en task.ts).
 */

export const TaskRuntime = {
    /**
     * Añade un tiempo límite a una Task.
     * Si la tarea no completa dentro de ms, se resuelve con el error dado.
     * Aborta la tarea interna al expirar.
     */
    timeout: <E, A>(ms: number, timeoutError: E, task: Task<E, A>): Task<E, A> =>
        Task.create((outerSignal) => {
            const controller = new AbortController();

            const onOuterAbort = () => controller.abort();
            outerSignal?.addEventListener('abort', onOuterAbort);

            const timerId = setTimeout(() => controller.abort(), ms);

            const timeoutPromise = new Promise<Result<E, A>>((resolve) => {
                controller.signal.addEventListener('abort', () => {
                    // Solo resolver con error si fue por timeout (no por outer abort)
                    if (!outerSignal?.aborted) {
                        resolve(Result.error(timeoutError));
                    }
                });
            });

            return Promise.race([
                task.fork(controller.signal),
                timeoutPromise
            ]).finally(() => {
                clearTimeout(timerId);
                outerSignal?.removeEventListener('abort', onOuterAbort);
            });
        }),

    /**
     * Reintenta una Task con backoff exponencial opcional.
     */
    retry: <E, A>(
        config: {
            attempts: number;
            delay?: number;
            backoff?: 'constant' | 'linear' | 'exponential';
            shouldRetry?: (error: E, attempt: number) => boolean;
        },
        task: Task<E, A>
    ): Task<E, A> =>
        Task.create(async (sig) => {
            let lastError: E | undefined;

            for (let i = 0; i < config.attempts; i++) {
                if (sig?.aborted) {
                    return Result.error(lastError as E);
                }

                const result = await task.fork(sig);

                if (result.isOk()) return result;

                lastError = result.error;

                if (config.shouldRetry && !config.shouldRetry(result.error, i + 1)) {
                    return result;
                }

                if (config.delay && i < config.attempts - 1) {
                    const factor = config.backoff === 'exponential'
                        ? Math.pow(2, i)
                        : config.backoff === 'linear'
                            ? i + 1
                            : 1;

                    await new Promise<void>((resolve) => {
                        const timer = setTimeout(resolve, config.delay! * factor);
                        sig?.addEventListener('abort', () => clearTimeout(timer), { once: true });
                    });
                }
            }

            return Result.error(lastError as E);
        }),

    /**
     * Ejecuta múltiples Tasks en paralelo. Falla si alguna falla (fail-fast).
     * Aborta las tareas restantes al primer error.
     */
    parallel: <E>(tasks: Task<E, unknown>[]): Task<E, unknown[]> =>
        Task.create((sig) => {
            return Promise.all(
                tasks.map(t => t.fork(sig))
            ).then(results => {
                const error = results.find(r => r.isErr());
                if (error) return error as Result<E, unknown[]>;
                return Result.ok(results.map(r => (r as any).value));
            });
        }),

    /**
     * El primero que termine (éxito o error) gana.
     * Aborta las tareas perdedoras.
     */
    race: <E, A>(tasks: Task<E, A>[]): Task<E, A> =>
        Task.create((sig) => {
            const controller = new AbortController();
            const onOuterAbort = () => controller.abort();
            sig?.addEventListener('abort', onOuterAbort);

            const promises = tasks.map(t => t.fork(controller.signal));

            return Promise.race(promises).then((result) => {
                controller.abort();
                sig?.removeEventListener('abort', onOuterAbort);
                return result;
            }, (err) => {
                controller.abort();
                sig?.removeEventListener('abort', onOuterAbort);
                throw err;
            });
        }),

    /**
     * Ejecuta tareas en secuencia. Falla al primer error.
     */
    sequence: <E, A>(tasks: Task<E, A>[]): Task<E, A[]> =>
        Task.create(async (sig) => {
            const results: A[] = [];
            for (const t of tasks) {
                if (sig?.aborted) return Result.error(undefined as unknown as E);
                const res = await t.fork(sig);
                if (res.isErr()) return res as unknown as Result<E, A[]>;
                results.push(res.value);
            }
            return Result.ok(results);
        }),

    /**
     * Pausa la ejecución por un número de milisegundos.
     */
    sleep: (ms: number): Task<never, void> =>
        Task.create((sig) => new Promise((resolve) => {
            const timer = setTimeout(() => resolve(Result.ok(undefined)), ms);
            sig?.addEventListener('abort', () => {
                clearTimeout(timer);
                resolve(Result.ok(undefined));
            }, { once: true });
        }))
};
