/**
 * Tipos algebraicos para mejorar la arquitectura TEA
 * 
 * Los tipos algebraicos proporcionan una forma más segura y expresiva de manejar
 * estados, errores y valores opcionales en lugar de depender de null/undefined.
 */

// ------------------------------------------
// TIPO MAYBE
// ------------------------------------------

/**
 * Maybe representa un valor que puede existir o no.
 * Es equivalente a Option en otros lenguajes funcionales.
 * 
 * @template A - Tipo del valor contenido
 */
export type Maybe<A> = Just<A> | Nothing;

/**
 * Constructor para un valor presente
 */
interface Just<A> {
  readonly _tag: 'Just';
  readonly value: A;
}

/**
 * Constructor para un valor ausente
 */
interface Nothing {
  readonly _tag: 'Nothing';
}

/**
 * Funciones auxiliares para construir Maybe
 */
export const Maybe = {
  /**
   * Crea un Maybe con un valor presente
   */
  just: <A>(value: A): Maybe<A> => ({ _tag: 'Just', value }),

  /**
   * Crea un Maybe sin valor
   */
  nothing: <A = never>(): Maybe<A> => ({ _tag: 'Nothing' }),

  /**
   * Transforma un valor nulo/undefined en un Maybe
   */
  fromNullable: <A>(value: A | null | undefined): Maybe<NonNullable<A>> =>
    value == null ? Maybe.nothing() : Maybe.just(value as NonNullable<A>),

  /**
   * Extrae el valor de un Maybe, con un valor por defecto
   */
  withDefault: <A>(defaultValue: A, maybe: Maybe<A>): A =>
    maybe._tag === 'Just' ? maybe.value : defaultValue,

  /**
   * Mapea un valor dentro de un Maybe
   */
  map: <A, B>(f: (a: A) => B, maybe: Maybe<A>): Maybe<B> =>
    maybe._tag === 'Just' ? Maybe.just(f(maybe.value)) : Maybe.nothing(),

  /**
   * Mapea un valor dentro de un Maybe con una función que devuelve otro Maybe
   */
  andThen: <A, B>(f: (a: A) => Maybe<B>, maybe: Maybe<A>): Maybe<B> =>
    maybe._tag === 'Just' ? f(maybe.value) : Maybe.nothing(),

  /**
   * Aplica una función contenida en Maybe a un valor contenido en Maybe
   */
  ap: <A, B>(maybeF: Maybe<(a: A) => B>, maybeA: Maybe<A>): Maybe<B> =>
    maybeF._tag === 'Just' && maybeA._tag === 'Just'
      ? Maybe.just(maybeF.value(maybeA.value))
      : Maybe.nothing(),

  /**
   * Verifica si un Maybe contiene un valor
   */
  isJust: <A>(maybe: Maybe<A>): boolean => maybe._tag === 'Just',

  /**
   * Verifica si un Maybe está vacío
   */
  isNothing: <A>(maybe: Maybe<A>): boolean => maybe._tag === 'Nothing',

  /**
   * Obtiene el valor de un Maybe o lanza un error
   */
  unsafeGet: <A>(maybe: Maybe<A>): A => {
    if (maybe._tag === 'Just') {
      return maybe.value;
    }
    throw new Error('Maybe.unsafeGet: Nothing value');
  }
};

// ------------------------------------------
// TIPO EITHER
// ------------------------------------------

/**
 * Either representa un valor que puede ser de dos tipos posibles.
 * Generalmente usado para operaciones que pueden fallar, donde Left representa el error.
 * 
 * @template L - Tipo del valor izquierdo (generalmente error)
 * @template R - Tipo del valor derecho (resultado exitoso)
 */
export type Either<L, R> = Left<L> | Right<R>;

/**
 * Constructor para un valor izquierdo (usualmente error)
 */
interface Left<L> {
  readonly _tag: 'Left';
  readonly left: L;
}

/**
 * Constructor para un valor derecho (resultado exitoso)
 */
interface Right<R> {
  readonly _tag: 'Right';
  readonly right: R;
}

/**
 * Funciones auxiliares para construir Either
 */
export const Either = {
  /**
   * Crea un Either con un valor izquierdo (error)
   */
  left: <L, R = never>(left: L): Either<L, R> => ({ _tag: 'Left', left }),

  /**
   * Crea un Either con un valor derecho (éxito)
   */
  right: <R, L = never>(right: R): Either<L, R> => ({ _tag: 'Right', right }),

  /**
   * Mapea el valor derecho de un Either
   */
  map: <L, A, B>(f: (a: A) => B, either: Either<L, A>): Either<L, B> =>
    either._tag === 'Right' ? Either.right(f(either.right)) : either,

  /**
   * Mapea el valor izquierdo de un Either
   */
  mapLeft: <L, M, R>(f: (left: L) => M, either: Either<L, R>): Either<M, R> =>
    either._tag === 'Left' ? Either.left(f(either.left)) : either,

  /**
   * Mapea un valor derecho con una función que devuelve otro Either
   */
  andThen: <L, A, B>(f: (a: A) => Either<L, B>, either: Either<L, A>): Either<L, B> =>
    either._tag === 'Right' ? f(either.right) : either,

  /**
   * Aplica una función contenida en Either a un valor contenido en Either
   */
  ap: <L, A, B>(eitherF: Either<L, (a: A) => B>, eitherA: Either<L, A>): Either<L, B> =>
    eitherF._tag === 'Left' ? eitherF :
    eitherA._tag === 'Left' ? eitherA :
    Either.right(eitherF.right(eitherA.right)),

  /**
   * Obtiene el valor derecho o un valor por defecto
   */
  getOrElse: <L, R>(defaultValue: R, either: Either<L, R>): R =>
    either._tag === 'Right' ? either.right : defaultValue,

  /**
   * Combina dos Either, manteniendo el primer error si ambos son Left
   */
 combine: <L, R>(first: Either<L, R>, second: Either<L, R>): Either<L, [R, R]> =>
    first._tag === 'Left' ? first :
    second._tag === 'Left' ? second :
    Either.right([first.right, second.right]),

  /**
   * Verifica si un Either es Right
   */
  isRight: <L, R>(either: Either<L, R>): boolean => either._tag === 'Right',

  /**
   * Verifica si un Either es Left
   */
  isLeft: <L, R>(either: Either<L, R>): boolean => either._tag === 'Left',

  /**
   * Transforma un Either en un Maybe, descartando el valor izquierdo
   */
  toMaybe: <L, R>(either: Either<L, R>): Maybe<R> =>
    either._tag === 'Right' ? Maybe.just(either.right) : Maybe.nothing()
};

// ------------------------------------------
// TIPO RESULT
// ------------------------------------------

/**
 * Ok - Resultado exitoso con métodos de instancia
 */
export interface Ok<E, T> {
  readonly _tag: 'Ok';
  readonly value: T;
  readonly error?: undefined;
  isOk(): this is Ok<E, T>;
  isErr(): this is Err<E, T>;
  isError(): this is Err<E, T>;
  map<B>(f: (a: T) => B): Result<E, B>;
  mapError<F>(f: (e: E) => F): Result<F, T>;
  andThen<B>(f: (a: T) => Result<E, B>): Result<E, B>;
  unwrapOr(_defaultValue: T): T;
  match<B>(onOk: (a: T) => B, onError: (e: E) => B): B;
  tap(f: (a: T) => void): Result<E, T>;
  tapError(f: (e: E) => void): Result<E, T>;
}

/**
 * Err - Resultado fallido con métodos de instancia
 */
export interface Err<E, T> {
  readonly _tag: 'Err';
  readonly value?: undefined;
  readonly error: E;
  isOk(): this is Ok<E, T>;
  isErr(): this is Err<E, T>;
  isError(): this is Err<E, T>;
  map<B>(f: (a: T) => B): Result<E, B>;
  mapError<F>(f: (e: E) => F): Result<F, T>;
  andThen<B>(f: (a: T) => Result<E, B>): Result<E, B>;
  unwrapOr(defaultValue: T): T;
  match<B>(onOk: (a: T) => B, onError: (e: E) => B): B;
  tap(f: (a: T) => void): Result<E, T>;
  tapError(f: (e: E) => void): Result<E, T>;
}

/**
 * Result es un tipo que representa éxito (Ok) o error (Err).
 * Soporta métodos de instancia para encadenamiento fluent y type narrowing.
 *
 * @template E - Tipo del error
 * @template T - Tipo del valor exitoso
 */
export type Result<E, T> = Ok<E, T> | Err<E, T>;

const createOk = <E, T>(value: T): Ok<E, T> => ({
  _tag: 'Ok',
  value,
  isOk: (): this is Ok<E, T> => true,
  isErr: (): this is Err<E, T> => false,
  isError: (): this is Err<E, T> => false,
  map: <B>(f: (a: T) => B): Result<E, B> => createOk<E, B>(f(value)),
  mapError: <F>(): Result<F, T> => createOk<F, T>(value),
  andThen: <B>(f: (a: T) => Result<E, B>): Result<E, B> => f(value),
  unwrapOr: (_defaultValue: T): T => value,
  match: <B>(onOk: (a: T) => B, _onError: (e: E) => B): B => onOk(value),
  tap: (f: (a: T) => void): Result<E, T> => { f(value); return createOk<E, T>(value); },
  tapError: (_f: (e: E) => void): Result<E, T> => createOk<E, T>(value),
});

const createErr = <E, T>(error: E): Err<E, T> => ({
  _tag: 'Err',
  error,
  isOk: (): this is Ok<E, T> => false,
  isErr: (): this is Err<E, T> => true,
  isError: (): this is Err<E, T> => true,
  map: <B>(_f: (a: T) => B): Result<E, B> => createErr<E, B>(error),
  mapError: <F>(f: (e: E) => F): Result<F, T> => createErr<F, T>(f(error)),
  andThen: <B>(_f: (a: T) => Result<E, B>): Result<E, B> => createErr<E, B>(error),
  unwrapOr: (defaultValue: T): T => defaultValue,
  match: <B>(_onOk: (a: T) => B, onError: (e: E) => B): B => onError(error),
  tap: (_f: (a: T) => void): Result<E, T> => createErr<E, T>(error),
  tapError: (f: (e: E) => void): Result<E, T> => { f(error); return createErr<E, T>(error); },
});

/**
 * Constructores y operadores para Result
 */
export const Result = {
  ok: <T, E = never>(value: T): Result<E, T> => createOk<E, T>(value),

  error: <E, T = never>(error: E): Result<E, T> => createErr<E, T>(error),

  map: <E, A, B>(f: (a: A) => B, result: Result<E, A>): Result<E, B> =>
    result.isOk() ? createOk<E, B>(f(result.value)) : result as unknown as Result<E, B>,

  mapError: <E, F, T>(f: (error: E) => F, result: Result<E, T>): Result<F, T> =>
    result.isErr() ? createErr<F, T>(f(result.error)) : result as unknown as Result<F, T>,

  andThen: <E, A, B>(f: (a: A) => Result<E, B>, result: Result<E, A>): Result<E, B> =>
    result.isOk() ? f(result.value) : result as unknown as Result<E, B>,

  withDefault: <E, T>(defaultValue: T, result: Result<E, T>): T =>
    result.isOk() ? result.value : defaultValue,

  isOk: <E, T>(result: Result<E, T>): result is Ok<E, T> => result._tag === 'Ok',

  isError: <E, T>(result: Result<E, T>): result is Err<E, T> => result._tag === 'Err',

  combine: <E, T>(results: Result<E, T>[]): Result<E, T[]> => {
    const values: T[] = [];
    for (const r of results) {
      if (r.isErr()) return r as unknown as Result<E, T[]>;
      values.push(r.value);
    }
    return createOk<E, T[]>(values);
  },

  fromNullable: <E, T>(error: E, value: T | null | undefined): Result<E, NonNullable<T>> =>
    value == null ? createErr<E, NonNullable<T>>(error) : createOk<E, NonNullable<T>>(value as NonNullable<T>),

  tryCatch: <E, T>(fn: () => T, onError: (e: unknown) => E): Result<E, T> => {
    try {
      return createOk<E, T>(fn());
    } catch (e) {
      return createErr<E, T>(onError(e));
    }
  },

  match: <E, T, B>(onOk: (a: T) => B, onError: (e: E) => B, result: Result<E, T>): B =>
    result.match(onOk, onError)
};

/**
 * Standalone constructors compatible with neverthrow API.
 * Permite: import { ok, err } from '@/shared/core'
 */
export const ok = <T, E = never>(value: T): Result<E, T> => createOk<E, T>(value);
export const err = <E, T = never>(error: E): Result<E, T> => createErr<E, T>(error);

// ------------------------------------------
// UTILIDADES PARA INTEGRACIÓN CON TEA
// ------------------------------------------

/**
 * Funciones para integrar tipos algebraicos con la arquitectura TEA
 */
export const TEAAlgebraicUtils = {
  /**
   * Convierte un Maybe a RemoteData
   */
 maybeToRemoteData: <E, A>(error: E, maybe: Maybe<A>) =>
    maybe._tag === 'Just' 
      ? { type: 'Success', data: maybe.value } as const
      : { type: 'Failure', error } as const,

  /**
   * Convierte un Either a RemoteData
   */
  eitherToRemoteData: <E, A>(either: Either<E, A>) =>
    either._tag === 'Right'
      ? { type: 'Success', data: either.right } as const
      : { type: 'Failure', error: either.left } as const,

  /**
   * Convierte un Result a RemoteData
   */
  resultToRemoteData: <E, A>(result: Result<E, A>) =>
    result.isOk()
      ? { type: 'Success', data: result.value } as const
      : { type: 'Failure', error: result.error } as const,

  /**
   * Convierte un RemoteData a Maybe
   */
  remoteDataToMaybe: <E, A>(remoteData: { type: string; data?: A; error?: E }): Maybe<A> =>
    remoteData.type === 'Success' && 'data' in remoteData
      ? Maybe.just(remoteData.data!)
      : Maybe.nothing(),

  /**
   * Convierte un RemoteData a Either
   */
  remoteDataToEither: <E, A>(remoteData: { type: string; data?: A; error?: E }): Either<E, A> =>
    remoteData.type === 'Success' && 'data' in remoteData
      ? Either.right(remoteData.data!)
      : remoteData.type === 'Failure' && 'error' in remoteData
        ? Either.left(remoteData.error!)
        : Either.left('Unknown error' as E)
};