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
 * Result es un alias de Either para operaciones que pueden fallar
 * 
 * @template E - Tipo del error
 * @template T - Tipo del valor exitoso
 */
export type Result<E, T> = Either<E, T>;

/**
 * Alias para construir resultados exitosos o fallidos
 */
export const Result = {
  /**
   * Crea un resultado exitoso
   */
  ok: <T, E = never>(value: T): Result<E, T> => Either.right(value),

  /**
   * Crea un resultado fallido
   */
  error: <E, T = never>(error: E): Result<E, T> => Either.left(error),

  /**
   * Mapea el valor exitoso
   */
  map: <E, A, B>(f: (a: A) => B, result: Result<E, A>): Result<E, B> =>
    Either.map(f, result),

 /**
   * Mapea el error
   */
  mapError: <E, F, T>(f: (error: E) => F, result: Result<E, T>): Result<F, T> =>
    Either.mapLeft(f, result),

  /**
   * Mapea un valor exitoso con una función que puede fallar
   */
  andThen: <E, A, B>(f: (a: A) => Result<E, B>, result: Result<E, A>): Result<E, B> =>
    Either.andThen(f, result),

  /**
   * Obtiene el valor o un valor por defecto
   */
  withDefault: <E, T>(defaultValue: T, result: Result<E, T>): T =>
    Either.getOrElse(defaultValue, result),

  /**
   * Verifica si es un resultado exitoso
   */
  isOk: <E, T>(result: Result<E, T>): boolean => Either.isRight(result),

  /**
   * Verifica si es un resultado fallido
   */
  isError: <E, T>(result: Result<E, T>): boolean => Either.isLeft(result)
};

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
    result._tag === 'Right'
      ? { type: 'Success', data: result.right } as const
      : { type: 'Failure', error: result.left } as const,

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