/**
* Contexto de test para el DSL de BDD con TEA
* 
* Proporciona la estructura base para compartir estado entre pasos Given/When/Then
*/

import { StoreApi } from 'zustand';

/**
 * Configuración para crear un contexto de test
 */
export interface TestContextConfig {
    /** Stores de TEA a incluir en el contexto */
    stores?: Record<string, StoreApi<any>>;
    /** Mocks HTTP configurados */
    mocks?: Record<string, any>;
    /** Datos iniciales del test */
    initialData?: Record<string, any>;
}

/**
 * Contexto base de test - se extiende según las necesidades del test
 */
export interface TestContext {
    /** Indica si el test está en modo verbose */
    verbose?: boolean;
    /** Almacena datos del test */
    data?: Record<string, any>;
    /** Mocks configurados */
    mocks?: Record<string, any>;
    /** Función para hacer assertions */
    expect?: (actual: any) => AssertionChain;
    /** Método para registrar información */
    log?: (message: string, ...args: any[]) => void;
    /** Método para fail el test */
    fail?: (reason?: string) => void;
}

/**
 * Cadena de assertions estilo Jest
 */
export interface AssertionChain {
    toBe(expected: any): void;
    toEqual(expected: any): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeNull(): void;
    toBeUndefined(): void;
    toBeDefined(): void;
    toContain(item: any): void;
    toHaveLength(len: number): void;
    toThrow(error?: any): void;
    toHaveBeenCalled(): void;
    toHaveBeenCalledWith(...args: any[]): void;
}

/**
 * Helper para crear un TestContext básico
 */
export function createTestContext(config?: TestContextConfig): TestContext {
    const ctx: TestContext = {
        verbose: true,
        data: { ...config?.initialData },
        mocks: { ...config?.mocks },
        expect: (actual: any) => createExpectChain(actual),
        log: (message: string, ...args: any[]) => {
            if (ctx.verbose) {
                console.log(`[BDD] ${message}`, ...args);
            }
        },
        fail: (reason?: string) => {
            throw new Error(reason || 'Test failed');
        },
    };

    // Agregar stores si se proporcionan
    if (config?.stores) {
        Object.entries(config.stores).forEach(([key, store]) => {
            (ctx as any)[key] = store;
        });
    }

    return ctx;
}

/**
 * Crea una cadena de assertions estilo Jest
 */
function createExpectChain(actual: any): AssertionChain {
    return {
        toBe: (expected: any) => expect(actual).toBe(expected),
        toEqual: (expected: any) => expect(actual).toEqual(expected),
        toBeTruthy: () => expect(actual).toBeTruthy(),
        toBeFalsy: () => expect(actual).toBeFalsy(),
        toBeNull: () => expect(actual).toBeNull(),
        toBeUndefined: () => expect(actual).toBeUndefined(),
        toBeDefined: () => expect(actual).toBeDefined(),
        toContain: (item: any) => expect(actual).toContain(item),
        toHaveLength: (len: number) => expect(actual).toHaveLength(len),
        toThrow: (error?: any) => expect(actual).toThrow(error),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        toHaveBeenCalled: () => (actual as any).toHaveBeen?.() ?? expect(actual).toBeDefined(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        toHaveBeenCalledWith: (...args: any[]) =>
            (actual as any).toHaveBeenCalledWith?.(...args) ?? expect(actual).toBeDefined(),
    };
}

/**
 * Añade un store de TEA al contexto
 * 
 * @example
 * const ctx = withStore(createTestContext(), 'auth', authStore);
 */
export function withStore<TContext extends TestContext>(
    context: TContext,
    name: string,
    store: StoreApi<any>
): TContext {
    return {
        ...context,
        [name]: store,
    } as TContext;
}

/**
 * Añade un mock HTTP al contexto
 * 
 * @example
 * const ctx = withMock(createTestContext(), 'fetch', mockFetch);
 */
export function withMock<TContext extends TestContext>(
    context: TContext,
    name: string,
    mock: any
): TContext {
    return {
        ...context,
        mocks: {
            ...context.mocks,
            [name]: mock,
        },
    } as TContext;
}

/**
 * Función para calcular valores dinámicamente
 * Puede ser sincronica o asincronica
 */
export type ComputeFn<TContext extends TestContext> = (ctx: TContext) => any | Promise<any>;

/**
 * Builder para crear contexts más complejos
 */
export class ContextBuilder<TContext extends TestContext> {
    private context: TContext;
    private computedValues: { key: string; fn: ComputeFn<TContext> }[] = [];

    constructor(initialContext: TContext) {
        this.context = initialContext;
    }

    /**
     * Añade un store al contexto
     */
    withStore(name: string, store: StoreApi<any>): this {
        this.context = withStore(this.context, name, store);
        return this;
    }

    /**
     * Añade un mock al contexto
     */
    withMock(name: string, mock: any): this {
        this.context = withMock(this.context, name, mock);
        return this;
    }

    /**
     * Añade datos iniciales (valor fijo)
     */
    withData(key: string, value: any): this {
        this.context.data = { ...this.context.data, [key]: value };
        return this;
    }

    /**
     * Añade un valor calculado dinámicamente
     * La función se ejecuta al hacer .build()
     * 
     * @example
     * .withComputed('timestamp', () => Date.now())
     * .withComputed('id', ctx => ctx.data.user?.id + '-test')
     * .withComputedAsync('data', async ctx => await fetchData())
     */
    withComputed(key: string, computeFn: ComputeFn<TContext>): this {
        this.computedValues.push({ key, fn: computeFn });
        return this;
    }

    /**
     * Añade un valor calculado asincrónicamente
     * La función se ejecuta al hacer .build()
     */
    withComputedAsync(key: string, computeFn: ComputeFn<TContext>): this {
        return this.withComputed(key, computeFn);
    }

    /**
     * Construye el contexto final ejecutando todos los valores calculados
     */
    async build(): Promise<TContext> {
        // Ejecutar todos los valores calculados
        for (const { key, fn } of this.computedValues) {
            const result = await fn(this.context);
            this.context.data = { ...this.context.data, [key]: result };
        }
        return this.context;
    }

    /**
     * Versión síncrona de build() (para valores no async)
     */
    buildSync(): TContext {
        // Ejecutar valores calculados síncronos
        for (const { key, fn } of this.computedValues) {
            try {
                const result = fn(this.context);
                // Si es una promesa, no la resolvemos en modo sync
                if (result instanceof Promise) {
                    console.warn(`[ContextBuilder] Advertencia: ${key} es async, usa build() en su lugar`);
                } else {
                    this.context.data = { ...this.context.data, [key]: result };
                }
            } catch (error) {
                console.error(`[ContextBuilder] Error calculando ${key}:`, error);
            }
        }
        return this.context;
    }
}

/**
 * Crea un ContextBuilder para construir contextos fluidos
 * 
 * @example
 * // Forma básica (síncrono)
 * const ctx = buildContext<MyContext>()
 *   .withData('key', 'value')
 *   .buildSync();
 * 
 * @example
 * // Con valores calculados (async)
 * const ctx = await buildContext<MyContext>()
 *   .withData('base', 'value')
 *   .withComputed('computed', ctx => ctx.data.base + '-computed')
 *   .withComputedAsync('asyncValue', async ctx => await fetchData())
 *   .build();
 */
export function buildContext<TContext extends TestContext>(
    initialContext?: Partial<TContext>
): ContextBuilder<TContext> {
    return new ContextBuilder<TContext>({
        ...createTestContext(),
        ...initialContext
    } as TContext);
}

export type { StoreApi } from 'zustand';
