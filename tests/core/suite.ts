/**
 * DSL de BDD con TEA - Suite Builder
 * 
 * Permite crear suites de tests con:
 * - Setup común (beforeAll/afterAll)
 * - Registro de scenarios desde archivos separados
 * - Ejecución orquestada de múltiples scenarios
 * 
 * Estructura esperada:
 * tests/
 *   features/
 *     premiación/
 *       suite.ts              # Orchestrador
 *       scenarios/
 *         winners.test.ts     # Scenario positivo
 *         losers.test.ts      # Scenario negativo
 */

import { TestContext } from './context';
import { ScenarioBuilder, ScenarioConfig, StepFn } from './scenario';

// Import estáticos de Jest - evitar require dinámico
import {
    describe,
    beforeAll,
    afterAll,
    beforeEach,
    afterEach,
    it,
    jest
} from '@jest/globals';

export interface SuiteConfig {
    /** Timeout para todos los scenarios */
    timeout?: number;
    /** Tags para filtrar execution */
    tags?: string[];
}

export interface SuiteHooks<TContext extends TestContext> {
    beforeAll?: (ctx: TContext) => void | Promise<void>;
    afterAll?: (ctx: TContext) => void | Promise<void>;
    beforeEach?: (ctx: TContext) => void | Promise<void>;
    afterEach?: (ctx: TContext) => void | Promise<void>;
}

/**
 * Representa un scenario registrado en la suite
 */
export interface RegisteredScenario<TContext extends TestContext> {
    name: string;
    builder: ScenarioBuilder<TContext>;
    tags?: string[];
}

/**
 * SuiteBuilder - Crea suites de tests con setup común
 */
export class SuiteBuilder<TContext extends TestContext> {
    private name: string;
    private scenarios: RegisteredScenario<TContext>[] = [];
    private hooks: SuiteHooks<TContext> = {};
    private config: SuiteConfig = {};
    private sharedContext: TContext;

    constructor(name: string, initialContext: TContext, config?: SuiteConfig) {
        this.name = name;
        this.sharedContext = initialContext;
        this.config = config ?? {};
    }

    /**
     * beforeAll - Setup común antes de todos los scenarios
     */
    beforeAll(fn: (ctx: TContext) => void | Promise<void>): this {
        this.hooks.beforeAll = fn;
        return this;
    }

    /**
     * afterAll - Cleanup común después de todos los scenarios
     */
    afterAll(fn: (ctx: TContext) => void | Promise<void>): this {
        this.hooks.afterAll = fn;
        return this;
    }

    /**
     * beforeEach - Setup antes de cada scenario
     */
    beforeEach(fn: (ctx: TContext) => void | Promise<void>): this {
        this.hooks.beforeEach = fn;
        return this;
    }

    /**
     * afterEach - Cleanup después de cada scenario
     */
    afterEach(fn: (ctx: TContext) => void | Promise<void>): this {
        this.hooks.afterEach = fn;
        return this;
    }

    /**
     * register - Registra un scenario en la suite
     * El scenario se ejecutará como parte de esta suite
     */
    register(name: string, builder: ScenarioBuilder<TContext>, tags?: string[]): this {
        this.scenarios.push({ name, builder, tags });
        return this;
    }

    /**
     * addScenario - Alias para register
     */
    addScenario(name: string, builder: ScenarioBuilder<TContext>, tags?: string[]): this {
        return this.register(name, builder, tags);
    }

    /**
     * getScenarios - Obtiene todos los scenarios registrados
     */
    getScenarios(): RegisteredScenario<TContext>[] {
        return this.scenarios;
    }

    /**
     * getHooks - Obtiene los hooks de la suite
     */
    getHooks(): SuiteHooks<TContext> {
        return this.hooks;
    }

    /**
     * run - Ejecuta la suite envolviendo cada scenario con los hooks
     * Genera tests de Jest con describe()
     * Usa imports estáticos de Jest (evita require dinámico)
     */
    run(): void {
        describe(this.name, () => {
            // Setup de contexto compartido
            let suiteContext: TContext;

            // beforeAll - una sola vez al inicio de la suite
            if (this.hooks.beforeAll) {
                beforeAll(async () => {
                    // Aplicar timeout configurado al beforeAll
                    jest.setTimeout(this.config.timeout ?? 60000);
                    suiteContext = { ...this.sharedContext } as TContext;
                    await this.hooks.beforeAll!(suiteContext);
                }, this.config.timeout ?? 60000);
            }

            // afterAll - una sola vez al final de la suite
            if (this.hooks.afterAll) {
                afterAll(async () => {
                    if (suiteContext) {
                        await this.hooks.afterAll!(suiteContext);
                    }
                });
            }

            // Ejecutar cada scenario registrado
            this.scenarios.forEach(({ name, builder, tags }) => {
                // Si tiene tags, verificar si debe ejecutarse
                const shouldRun = !this.config.tags ||
                    !tags ||
                    tags.some(tag => this.config.tags!.includes(tag));

                if (!shouldRun) {
                    return;
                }

                describe(name, () => {
                    let scenarioContext: TContext;

                    // beforeEach - antes de cada scenario
                    if (this.hooks.beforeEach) {
                        beforeEach(async () => {
                            scenarioContext = { ...suiteContext } as TContext;
                            await this.hooks.beforeEach!(scenarioContext);
                        });
                    }

                    // afterEach - después de cada scenario
                    if (this.hooks.afterEach) {
                        afterEach(async () => {
                            if (scenarioContext) {
                                await this.hooks.afterEach!(scenarioContext);
                            }
                        });
                    }

                    // Ejecutar el scenario
                    it(name, async () => {
                        // Aplicar timeout al test
                        jest.setTimeout(this.config.timeout ?? 60000);
                        scenarioContext = { ...suiteContext } as TContext;

                        // Ejecutar los pasos del scenario
                        await builder.runSteps(scenarioContext);
                    }, this.config.timeout ?? 60000);
                });
            });
        });
    }

}

/**
 * Crea una nueva suite de tests
 */
export function createSuite<TContext extends TestContext>(
    name: string,
    initialContext?: TContext,
    config?: SuiteConfig
): SuiteBuilder<TContext> {
    const ctx = initialContext ?? ({} as TContext);
    return new SuiteBuilder<TContext>(name, ctx, config);
}

/**
 * Registry global de suites - permite registro desde cualquier archivo
 */
class SuiteRegistry {
    private suites: Map<string, SuiteBuilder<any>> = new Map();

    /**
     * Crea o obtiene una suite por nombre
     */
    getOrCreate<TContext extends TestContext>(
        name: string,
        initialContext?: TContext,
        config?: SuiteConfig
    ): SuiteBuilder<TContext> {
        if (!this.suites.has(name)) {
            this.suites.set(name, createSuite(name, initialContext, config));
        }
        return this.suites.get(name) as SuiteBuilder<TContext>;
    }

    /**
     * Obtiene una suite existente
     */
    get(name: string): SuiteBuilder<any> | undefined {
        return this.suites.get(name);
    }

    /**
     * Obtiene todas las suites
     */
    getAll(): SuiteBuilder<any>[] {
        return Array.from(this.suites.values());
    }

    /**
     * Limpia el registry (útil para testing)
     */
    clear(): void {
        this.suites.clear();
    }
}

// Instancia singleton global
export const suiteRegistry = new SuiteRegistry();

/**
 * Obtiene o crea una suite del registry global
 */
export function getSuite<TContext extends TestContext>(
    name: string,
    initialContext?: TContext,
    config?: SuiteConfig
): SuiteBuilder<TContext> {
    return suiteRegistry.getOrCreate(name, initialContext, config);
}
