/**
 * Utility for lazy initialization of values.
 * 
 * This is useful for creating singleton-like patterns that need to be
 * configured before use, avoiding race conditions in module loading.
 * 
 * @example
 * // Create a lazy reference
 * const lazyEngine = createLazy(() => {
 *     if (!isConfigured) {
 *         throw new Error('Engine not configured');
 *     }
 *     return { effectHandlers, middlewares };
 * });
 * 
 * // Use it later
 * const { effectHandlers, middlewares } = lazyEngine.get();
 * 
 * @example
 * // With fallback
 * const lazyConfig = createLazy(
 *     () => config ?? defaultConfig,
 *     () => defaultConfig  // fallback when primary throws
 * );
 */

export interface Lazy<T> {
    /**
     * Gets the value, throwing if not initialized
     */
    get(): T;

    /**
     * Checks if the value has been initialized
     */
    isInitialized(): boolean;

    /**
     * Resets the lazy value (useful for testing)
     */
    reset(): void;
}

export interface LazyWithFallback<T> extends Lazy<T> {
    /**
     * Gets the value, falling back to fallback if not initialized
     */
    getOrElse(fallback: T): T;
}

/**
 * Creates a lazy initialized value
 * 
 * @param initializer - Function that returns the value (called once on first get)
 * @param fallback - Optional fallback if initializer throws (for getOrElse)
 */
export function createLazy<T>(
    initializer: () => T,
    fallback?: () => T
): LazyWithFallback<T> {
    let value: T | undefined;
    let initialized = false;
    let error: Error | null = null;

    return {
        get(): T {
            if (initialized) {
                return value as T;
            }

            if (error && !fallback) {
                throw error;
            }

            try {
                value = initializer();
                initialized = true;
                return value;
            } catch (e) {
                if (fallback) {
                    value = fallback();
                    initialized = true;
                    return value;
                }
                error = e instanceof Error ? e : new Error(String(e));
                throw error;
            }
        },

        isInitialized(): boolean {
            return initialized;
        },

        reset(): void {
            value = undefined;
            initialized = false;
            error = null;
        },

        getOrElse(fallbackValue: T): T {
            if (initialized) {
                return value as T;
            }

            try {
                value = initializer();
                initialized = true;
                return value;
            } catch {
                if (fallback) {
                    value = fallback();
                    initialized = true;
                    return value;
                }
                return fallbackValue;
            }
        }
    };
}

/**
 * Creates a lazy reference that can be set explicitly
 * Useful for configuration patterns
 * 
 * @example
 * const config = createLazyRef<EngineConfig>();
 * 
 * // Later in app bootstrap:
 * config.set({ effectHandlers, middlewares });
 * 
 * // In store:
 * const { effectHandlers } = config.get();
 */
export interface LazyRef<T> {
    /**
     * Sets the value
     */
    set(value: T): void;

    /**
     * Gets the value, throwing if not set
     */
    get(): T;

    /**
     * Gets the value or returns default if not set
     */
    getOrElse(defaultValue: T): T;

    /**
     * Checks if value has been set
     */
    isSet(): boolean;

    /**
     * Resets the ref
     */
    reset(): void;
}

export function createLazyRef<T>(): LazyRef<T> {
    let value: T | undefined;
    let setFlag = false;

    return {
        set(newValue: T): void {
            value = newValue;
            setFlag = true;
        },

        get(): T {
            if (!setFlag) {
                throw new Error(
                    '[LazyRef] Value not set. ' +
                    'Call set() before get()'
                );
            }
            return value as T;
        },

        getOrElse(defaultValue: T): T {
            return setFlag ? (value as T) : defaultValue;
        },

        isSet(): boolean {
            return setFlag;
        },

        reset(): void {
            value = undefined;
            setFlag = false;
        }
    };
}
