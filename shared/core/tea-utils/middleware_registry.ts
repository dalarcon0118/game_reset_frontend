import { TeaMiddleware } from './middleware.types';

/**
 * Global registry for TEA Middlewares.
 * Allows registering middlewares that will be automatically applied to all stores.
 */
export class MiddlewareRegistry {
    private static globalMiddlewares: TeaMiddleware<any, any>[] = [];

    /**
     * Registers a middleware globally.
     */
    static register(middleware: TeaMiddleware<any, any>) {
        // Avoid duplicate registration if id is provided
        if (middleware.id && this.globalMiddlewares.some(m => m.id === middleware.id)) {
            return;
        }
        this.globalMiddlewares.push(middleware);
    }

    /**
     * Returns all registered global middlewares.
     */
    static getGlobals(): TeaMiddleware<any, any>[] {
        return [...this.globalMiddlewares];
    }

    /**
     * Clears all global middlewares (useful for testing).
     */
    static clear() {
        this.globalMiddlewares = [];
    }
}
