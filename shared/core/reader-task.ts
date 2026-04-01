import { Task } from './task';

/**
 * ReaderTask<D, E, A> - Inyección de Dependencias + Efectos Asíncronos
 *
 * Combina el patrón Reader (para inyección de dependencias) con Task (para efectos).
 * Las dependencias se inyectan en el momento de ejecución vía .run(deps).
 *
 * Inspirado en ReaderT de Haskell y el patrón de environments en FP.
 *
 * @template D - Tipo de las dependencias
 * @template E - Tipo del error
 * @template A - Tipo del valor exitoso
 *
 * @example
 * const fetchUser: ReaderTask<{ api: IApi }, Error, User> =
 *     ReaderTask.asks(({ api }) =>
 *         Task.fromPromise(() => api.getUser())
 *     );
 *
 * // En runtime:
 * fetchUser.run({ api: realApi }).fork();
 */
export interface ReaderTask<D, E, A> {
    readonly run: (deps: D) => Task<E, A>;
    map<B>(f: (a: A) => B): ReaderTask<D, E, B>;
    andThen<B>(f: (a: A) => ReaderTask<D, E, B>): ReaderTask<D, E, B>;
    mapError<F>(f: (e: E) => F): ReaderTask<D, F, A>;
    local<D2>(f: (deps: D2) => D): ReaderTask<D2, E, A>;
}

export const ReaderTask = {
    create: <D, E, A>(run: (deps: D) => Task<E, A>): ReaderTask<D, E, A> => ({
        run,
        map: (f) => ReaderTask.create((deps) => run(deps).map(f)),
        andThen: (f) => ReaderTask.create((deps) =>
            run(deps).andThen((a) => f(a).run(deps))
        ),
        mapError: (f) => ReaderTask.create((deps) => run(deps).mapError(f)),
        local: <D2>(f: (deps: D2) => D) =>
            ReaderTask.create<D2, E, A>((deps2) => run(f(deps2)))
    }),

    ask: <D, E = never>(): ReaderTask<D, E, D> =>
        ReaderTask.create((deps) => Task.succeed(deps)),

    asks: <D, E, A>(f: (deps: D) => Task<E, A>): ReaderTask<D, E, A> =>
        ReaderTask.create(f),

    succeed: <D, A, E = never>(value: A): ReaderTask<D, E, A> =>
        ReaderTask.create(() => Task.succeed(value)),

    fail: <D, E, A = never>(error: E): ReaderTask<D, E, A> =>
        ReaderTask.create(() => Task.fail(error)),

    fromTask: <D, E, A>(task: Task<E, A>): ReaderTask<D, E, A> =>
        ReaderTask.create(() => task)
};
