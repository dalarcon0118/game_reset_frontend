/**
 * Adaptador Detox para el DSL de BDD con TEA
 * 
 * Extiende el ScenarioBuilder con acciones de Detox para tests E2E móviles
 */

import { StepFn } from './scenario';
import { TestContext } from './context';

/**
 * Contexto extendido con métodos de Detox
 */
export interface DetoxTestContext extends TestContext {
    /** Toca un elemento por ID de test */
    tap: (elementId: string) => Promise<void>;
    /** Toca un elemento en coordenadas específicas */
    tapAt: (x: number, y: number) => Promise<void>;
    /** Larga presión en un elemento */
    longPress: (elementId: string, duration?: number) => Promise<void>;
    /** Escribe texto en un campo */
    fill: (elementId: string, text: string) => Promise<void>;
    /** Limpia un campo de texto */
    clear: (elementId: string) => Promise<void>;
    /** Espera hasta que un elemento sea visible */
    waitFor: (elementId: string, timeout?: number) => Promise<void>;
    /** Scroll en un elemento */
    scroll: (elementId: string, direction: 'up' | 'down' | 'left' | 'right', amount?: number) => Promise<void>;
    /** Swipe en un elemento */
    swipe: (elementId: string, direction: 'up' | 'down' | 'left' | 'right', speed?: 'fast' | 'slow') => Promise<void>;
    /** Obtiene el texto de un elemento */
    getText: (elementId: string) => Promise<string>;
    /** Verifica si un elemento existe */
    exists: (elementId: string) => Promise<boolean>;
    /** Takes a screenshot */
    screenshot: (name?: string) => Promise<void>;
}

/**
 * Builder de escenarios con soporte para Detox
 */
export class DetoxScenarioBuilder<TContext extends DetoxTestContext = DetoxTestContext> {
    private description: string;
    private context: TContext;
    private givenFn?: StepFn<TContext>;
    private whenFn?: StepFn<TContext>;
    private thenFn?: StepFn<TContext>;

    constructor(description: string, initialContext: TContext) {
        this.description = description;
        this.context = initialContext;
    }

    /**
     * Given - Prepara el estado inicial del escenario
     * Soporta dos formas:
     * - given(fn): solo función
     * - given('descripcion', fn): descripción + función
     */
    given(descriptionOrFn: string | StepFn<TContext>, maybeFn?: StepFn<TContext>): this {
        const fn = typeof descriptionOrFn === 'function' ? descriptionOrFn : maybeFn;
        if (fn) {
            this.givenFn = fn;
        }
        return this;
    }

    /**
     * When - Ejecuta la acción a probar
     * Soporta dos formas:
     * - when(fn): solo función
     * - when('descripcion', fn): descripción + función
     */
    when(descriptionOrFn: string | StepFn<TContext>, maybeFn?: StepFn<TContext>): this {
        const fn = typeof descriptionOrFn === 'function' ? descriptionOrFn : maybeFn;
        if (fn) {
            this.whenFn = fn;
        }
        return this;
    }

    /**
     * Then - Verifica el resultado esperado
     * Soporta dos formas:
     * - then(fn): solo función
     * - then('descripcion', fn): descripción + función
     */
    then(descriptionOrFn: string | StepFn<TContext>, maybeFn?: StepFn<TContext>): this {
        const fn = typeof descriptionOrFn === 'function' ? descriptionOrFn : maybeFn;
        if (fn) {
            this.thenFn = fn;
        }
        return this;
    }

    /**
     * And - Añade un paso adicional
     * Soporta dos formas:
     * - and(fn): solo función
     * - and('descripcion', fn): descripción + función
     */
    and(descriptionOrFn: string | StepFn<TContext>, maybeFn?: StepFn<TContext>): this {
        const fn = typeof descriptionOrFn === 'function' ? descriptionOrFn : maybeFn;
        if (!fn) return this;

        if (!this.whenFn && !this.thenFn) {
            return this.given(fn);
        } else if (!this.thenFn) {
            return this.when(fn);
        }
        return this.then(fn);
    }

    /**
     * Ejecuta el escenario
     */
    async run(): Promise<TContext> {
        if (this.givenFn) {
            await (this.givenFn as any)(this.context);
        }

        if (this.whenFn) {
            await (this.whenFn as any)(this.context);
        }

        if (this.thenFn) {
            await (this.thenFn as any)(this.context);
        }

        return this.context;
    }

    /**
     * Registra como test de Jest con Detox
     */
    test(): void {
        const { test } = require('@jest/globals');
        test(this.description, async () => {
            await this.run();
        }, 30000); // Timeout de 30s para E2E
    }
}

/**
 * Crea un escenario con integración Detox
 */
export function detoxScenario<TContext extends DetoxTestContext = DetoxTestContext>(
    description: string,
    initialContext?: TContext
): DetoxScenarioBuilder<TContext> {
    const ctx = initialContext ?? (createDetoxContext() as TContext);
    return new DetoxScenarioBuilder<TContext>(description, ctx);
}

/**
 * Crea un contexto base con métodos de Detox
 */
export function createDetoxContext(): DetoxTestContext {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { element, by, waitFor, device } = require('detox');

    return {
        verbose: true,
        data: {},
        mocks: {},
        expect: (actual: any) => {
            // Delegar a expect de Jest/Detox
            return expect(actual);
        },
        log: (message: string, ...args: any[]) => {
            console.log(`[DETOX BDD] ${message}`, ...args);
        },
        fail: (reason?: string) => {
            throw new Error(reason || 'Detox test failed');
        },

        // Acciones de Detox
        tap: async (elementId: string) => {
            await element(by.id(elementId)).tap();
        },

        tapAt: async (x: number, y: number) => {
            await device.tap(x, y);
        },

        longPress: async (elementId: string, duration = 1000) => {
            await element(by.id(elementId)).longPress(duration);
        },

        fill: async (elementId: string, text: string) => {
            await element(by.id(elementId)).typeText(text);
        },

        clear: async (elementId: string) => {
            await element(by.id(elementId)).clearText();
        },

        waitFor: async (elementId: string, timeout = 10000) => {
            await waitFor(element(by.id(elementId)))
                .toBeVisible()
                .withTimeout(timeout);
        },

        scroll: async (elementId: string, direction: 'up' | 'down' | 'left' | 'right', amount = 1) => {
            await element(by.id(elementId)).scroll(amount, direction);
        },

        swipe: async (elementId: string, direction: 'up' | 'down' | 'left' | 'right', speed = 'fast') => {
            await element(by.id(elementId)).swipe(direction, speed);
        },

        getText: async (elementId: string) => {
            return await element(by.id(elementId)).getText();
        },

        exists: async (elementId: string) => {
            return await element(by.id(elementId)).exists();
        },

        screenshot: async (name?: string) => {
            await device.takeScreenshot(name || `screenshot-${Date.now()}`);
        },
    };
}

/**
 * Crea un test E2E con Detox
 */
export function detoxTest(
    description: string,
    scenario: (ctx: DetoxTestContext) => void | Promise<void>
): void {
    const { test } = require('@jest/globals');

    test(description, async () => {
        const ctx = createDetoxContext();
        await scenario(ctx);
    }, 30000);
}

/**
 * DSL fluido para E2E con Detox
 * 
 * @example
 * detoxScenario('user login')
 *   .given(ctx => {
 *     ctx.waitFor('loginScreen');
 *   })
 *   .when(ctx => {
 *     ctx.fill('username', 'testuser');
 *     ctx.fill('password', 'password123');
 *     ctx.tap('loginButton');
 *   })
 *   .then(ctx => {
 *     ctx.waitFor('dashboard');
 *   })
 *   .test();
 */
export const e2e = detoxScenario;
