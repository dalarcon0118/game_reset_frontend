import { Result, Either } from './algebraic-types';

/**
 * Task<E, A> - Mónada de Efectos Asíncronos Pura (Estilo Elm)
 *
 * Representa una computación perezosa (lazy) que puede fallar con E o tener éxito con A.
 * No realiza ninguna acción hasta que se llama a .fork().
 *
 * Principios:
 * - Pura: sin side effects, sin orquestación
 * - Lazy: nada se ejecuta hasta fork()
 * - Composable: map, andThen, mapError
 *
 * @template E - Tipo del error
 * @template A - Tipo del valor exitoso
 */
export interface Task<E, A> {
    readonly fork: (signal?: AbortSignal) => Promise<Result<E, A>>;
    map<B>(f: (a: A) => B): Task<E, B>;
    andThen<B>(f: (a: A) => Task<E, B>): Task<E, B>;
    mapError<F>(f: (e: E) => F): Task<F, A>;
    /** Recupera del error con una función que retorna Task */
    orElse<F>(f: (e: E) => Task<F, A>): Task<F, A>;
    tap(f: (a: A) => void): Task<E, A>;
    tapError(f: (e: E) => void): Task<E, A>;
}

export const Task = {
    create: <E, A>(fork: (signal?: AbortSignal) => Promise<Result<E, A>>): Task<E, A> => ({
        fork,
        map: (f) => Task.create((sig) => fork(sig).then(res => Result.map(f, res))),
        andThen: <B>(f: (a: A) => Task<E, B>) => Task.create<E, B>((sig) => fork(sig).then((res): Promise<Result<E, B>> | Result<E, B> =>
            res.isOk() ? f(res.value).fork(sig) : res as any
        )),
        mapError: (f) => Task.create((sig) => fork(sig).then(res => Result.mapError(f, res))),
        orElse: <F>(f: (e: E) => Task<F, A>) => Task.create<F, A>((sig) => fork(sig).then((res): Promise<Result<F, A>> | Result<F, A> =>
            res.isErr() ? f(res.error).fork(sig) : res as any
        )),
        tap: (f) => Task.create((sig) => fork(sig).then(res => {
            if (res.isOk()) f(res.value);
            return res;
        })),
        tapError: (f) => Task.create((sig) => fork(sig).then(res => {
            if (res.isErr()) f(res.error);
            return res;
        }))
    }),

    succeed: <A, E = never>(value: A): Task<E, A> =>
        Task.create(async () => Result.ok(value)),

    fail: <E, A = never>(error: E): Task<E, A> =>
        Task.create(async () => Result.error(error)),

    fromPromise: <A, E = Error>(fn: (signal?: AbortSignal) => Promise<A>): Task<E, A> =>
        Task.create(async (sig) => {
            try {
                const value = await fn(sig);
                return Result.ok(value);
            } catch (e) {
                return Result.error(e as E);
            }
        }),

    fromSync: <A, E = Error>(fn: () => A): Task<E, A> =>
        Task.create(async () => {
            try {
                return Result.ok(fn());
            } catch (e) {
                return Result.error(e as E);
            }
        }),

    fromResult: <E, A>(result: Result<E, A>): Task<E, A> =>
        Task.create(async () => result),

    fromResultAsync: <E, A>(promise: Promise<Result<E, A>>): Task<E, A> =>
        Task.create(async () => promise),

    fromEither: <L, R>(either: Either<L, R>): Task<L, R> =>
        Task.create(async () => either._tag === 'Right' ? Result.ok(either.right) : Result.error(either.left))
};
