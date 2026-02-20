/**
 * Versión extendida de RemoteData usando tipos algebraicos
 * 
 * Esta extensión combina el patrón RemoteData con los tipos algebraicos
 * para ofrecer una gestión de estados asíncronos aún más robusta.
 */

import { Maybe, Either, Result, TEAAlgebraicUtils } from './algebraic-types';
import { RemoteData } from './remote.data';

/**
 * Extensión de RemoteData para incluir tipos algebraicos
 */
export type AlgebraicRemoteData<E, A> =
  | { type: 'NotAsked' }
  | { type: 'Loading' }
  | { type: 'Failure'; error: E }
  | { type: 'Success'; data: A };

/**
 * Funciones extendidas para trabajar con RemoteData y tipos algebraicos
 */
export const AlgebraicRemoteData = {
  ...RemoteData, // Extiende la funcionalidad existente

  /**
   * Convierte un RemoteData a un Maybe
   */
  toMaybe: <E, A>(rd: AlgebraicRemoteData<E, A>): Maybe<A> => {
    if (rd.type === 'Success') {
      return { _tag: 'Just', value: rd.data };
    }
    return { _tag: 'Nothing' };
  },

  /**
   * Convierte un RemoteData a un Either
   */
  toEither: <E, A>(rd: AlgebraicRemoteData<E, A>): Either<E, A> => {
    if (rd.type === 'Success') {
      return { _tag: 'Right', right: rd.data };
    }
    if (rd.type === 'Failure') {
      return { _tag: 'Left', left: rd.error };
    }
    // Para NotAsked y Loading, retornamos un error genérico
    return { _tag: 'Left', left: 'Operation not completed yet' as E };
  },

  /**
   * Crea un RemoteData desde un Maybe
   */
  fromMaybe: <E, A>(error: E, maybe: Maybe<A>): AlgebraicRemoteData<E, A> => {
    if (maybe._tag === 'Just') {
      return { type: 'Success', data: maybe.value };
    }
    return { type: 'Failure', error };
  },

  /**
   * Crea un RemoteData desde un Either
   */
  fromEither: <E, A>(either: Either<E, A>): AlgebraicRemoteData<E, A> => {
    if (either._tag === 'Right') {
      return { type: 'Success', data: either.right };
    }
    return { type: 'Failure', error: either.left };
  },

 /**
   * Mapea un RemoteData a través de una función que puede fallar (devolviendo un Either)
   */
  andThen: <E, A, B>(
    f: (data: A) => Either<E, B>,
    rd: AlgebraicRemoteData<E, A>
  ): AlgebraicRemoteData<E, B> => {
    if (rd.type === 'Success') {
      const result = f(rd.data);
      return AlgebraicRemoteData.fromEither(result);
    }
    // Si no es éxito, mantenemos el estado original
    return rd as AlgebraicRemoteData<E, B>;
  },

  /**
   * Mapea un RemoteData a través de una función que puede producir un valor opcional (Maybe)
   */
  andThenMaybe: <E, A, B>(
    f: (data: A) => Maybe<B>,
    rd: AlgebraicRemoteData<E, A>
  ): AlgebraicRemoteData<E, B> => {
    if (rd.type === 'Success') {
      const maybeResult = f(rd.data);
      return AlgebraicRemoteData.fromMaybe(
        'Value not available' as E,
        maybeResult
      );
    }
    // Si no es éxito, mantenemos el estado original
    return rd as AlgebraicRemoteData<E, B>;
  }
};

// Extendemos la interfaz RemoteData existente para mantener compatibilidad
export { RemoteData } from './remote.data';

// Exportamos también una versión que integra ambos enfoques
export const ExtendedRemoteData = {
  ...RemoteData,
  ...AlgebraicRemoteData,
  utils: TEAAlgebraicUtils
};