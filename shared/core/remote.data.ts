/**
 * RemoteData pattern for handling asynchronous data states.
 * Based on: https://elmprogramming.com/remote-data.html
 * 
 * Compatible with the TEA (The Elm Architecture) implementation.
 */

// Discriminated union for the 4 states
export type RemoteData<E, A> =
    | { type: 'NotAsked' }
    | { type: 'Loading' }
    | { type: 'Failure'; error: E }
    | { type: 'Success'; data: A };

/**
 * WebData is a specialized version of RemoteData where the error is of any type (usually Error).
 * This is a common alias in Elm's remotedata-http.
 */
export type WebData<A> = RemoteData<any, A>;

// Static constructors and helpers
export const RemoteData = {
    notAsked: <E, A>(): RemoteData<E, A> => ({ type: 'NotAsked' }),

    loading: <E, A>(): RemoteData<E, A> => ({ type: 'Loading' }),

    failure: <E, A>(error: E): RemoteData<E, A> => ({ type: 'Failure', error }),

    success: <E, A>(data: A): RemoteData<E, A> => ({ type: 'Success', data }),

    // --- Query Helpers ---

    isNotAsked: <E, A>(rd: RemoteData<E, A>): boolean => rd.type === 'NotAsked',

    isLoading: <E, A>(rd: RemoteData<E, A>): boolean => rd.type === 'Loading',

    isFailure: <E, A>(rd: RemoteData<E, A>): boolean => rd.type === 'Failure',

    isSuccess: <E, A>(rd: RemoteData<E, A>): boolean => rd.type === 'Success',

    // --- Transformation Helpers ---

    /**
     * Map the success data.
     */
    map: <E, A, B>(
        f: (data: A) => B,
        rd: RemoteData<E, A>
    ): RemoteData<E, B> => {
        if (rd.type === 'Success') {
            return { type: 'Success', data: f(rd.data) };
        }
        return rd as unknown as RemoteData<E, B>;
    },

    /**
     * Map the error data.
     */
    mapFailure: <E, A, F>(
        f: (error: E) => F,
        rd: RemoteData<E, A>
    ): RemoteData<F, A> => {
        if (rd.type === 'Failure') {
            return { type: 'Failure', error: f(rd.error) };
        }
        return rd as unknown as RemoteData<F, A>;
    },

    /**
     * Unwrap the value with a default fallback.
     */
    withDefault: <E, A>(defaultVal: A, rd: RemoteData<E, A>): A => {
        if (rd.type === 'Success') {
            return rd.data;
        }
        return defaultVal;
    },

    /**
     * Fold (match) over the states to produce a value.
     * Useful for rendering views based on state.
     */
    fold: <E, A, R>(
        matchers: {
            notAsked: () => R;
            loading: () => R;
            failure: (err: E) => R;
            success: (data: A) => R;
        },
        rd: RemoteData<E, A>
    ): R => {
        switch (rd.type) {
            case 'NotAsked': return matchers.notAsked();
            case 'Loading': return matchers.loading();
            case 'Failure': return matchers.failure(rd.error);
            case 'Success': return matchers.success(rd.data);
        }
    },

    /**
     * Chain a function that returns a RemoteData.
     * (Monadic bind / flatMap)
     */
    andThen: <E, A, B>(
        f: (data: A) => RemoteData<E, B>,
        rd: RemoteData<E, A>
    ): RemoteData<E, B> => {
        if (rd.type === 'Success') {
            return f(rd.data);
        }
        return rd as unknown as RemoteData<E, B>;
    }
};
