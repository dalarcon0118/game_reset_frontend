/**
 * Adaptador Jest para el DSL de BDD con TEA
 * 
 * Integra el Scenario Builder con el test runner de Jest
 */

import { TestContext, createTestContext } from './context';
import { StepFn, SuccessFn, FailureFn, NamedStep } from './scenario';

export interface ScenarioSteps<TContext extends TestContext> {
    given?: StepFn<TContext> | StepFn<TContext>[];
    when?: StepFn<TContext> | StepFn<TContext>[];
    then?: StepFn<TContext> | StepFn<TContext>[];
    steps?: {
        given: NamedStep<TContext>[];
        when: NamedStep<TContext>[];
        then: NamedStep<TContext>[];
    };
    execute?: StepFn<TContext>;
    onSuccess?: SuccessFn<TContext>;
    onFailed?: FailureFn<TContext>;
}

/**
 * Crea un test de Jest a partir de un ScenarioBuilder
 * 
 * @param description - Descripción del test
 * @param initialContext - Contexto inicial
 * @param steps - Pasos Given/When/Then o una función execute única
 */
export function createJestTest<TContext extends TestContext>(
    description: string,
    initialContext: TContext,
    steps: ScenarioSteps<TContext>,
    timeout?: number
): void {
    // Crear test de Jest
    test(description, async () => {
        // Crear contexto fresco para cada test
        const ctx = createTestContext({
            initialData: initialContext.data,
            mocks: initialContext.mocks,
            stores: (initialContext as any).stores,
        });

        // Copiar propiedades adicionales del contexto inicial
        Object.keys(initialContext).forEach((key) => {
            if (!(key in ctx) && key !== 'expect') {
                (ctx as any)[key] = (initialContext as any)[key];
            }
        });

        try {
            // Si hay pasos con descripciones (nuevo formato)
            if (steps.steps) {
                const { given, when, then } = steps.steps as any;

                // Given - ejecutar con logging
                for (const step of given) {
                    console.log(`  ✓ given: ${step.description}`);
                    await (step.fn as any)(ctx);
                }

                // When - ejecutar con logging
                for (const step of when) {
                    console.log(`  ✓ when: ${step.description}`);
                    await (step.fn as any)(ctx);
                }

                // Then - ejecutar con logging
                for (const step of then) {
                    console.log(`  ✓ then: ${step.description}`);
                    await (step.fn as any)(ctx);
                }
            }
            // Si hay una función execute directa, la usamos (formato legacy)
            else if (steps.execute) {
                await (steps.execute as any)(ctx);
            } else {
                // Helper para ejecutar un paso o array de pasos
                const executeStep = async (step: StepFn<TContext> | StepFn<TContext>[] | undefined) => {
                    if (!step) return;
                    if (Array.isArray(step)) {
                        for (const fn of step) {
                            await (fn as any)(ctx);
                        }
                    } else {
                        await (step as any)(ctx);
                    }
                };

                // Given prepara el estado
                await executeStep(steps.given);

                // When ejecuta la acción
                await executeStep(steps.when);

                // Then verifica el resultado
                await executeStep(steps.then);
            }

            // onSuccess callback
            if (steps.onSuccess) {
                await (steps.onSuccess as any)(ctx);
            }
        } catch (error) {
            // onFailed callback
            if (steps.onFailed) {
                await (steps.onFailed as any)(ctx, error as Error);
            }
            // Rethrow para que Jest marque el test como fallido
            throw error;
        }
    }, timeout);
}

/**
 * Crea un describe block con tests BDD
 * 
 * @param feature - Nombre de la feature
 * @param scenarios - Array de escenarios a ejecutar
 */
export function describeFeature<TContext extends TestContext>(
    feature: string,
    scenarios: {
        name: string;
        context?: TContext;
        steps: ScenarioSteps<TContext>;
    }[]
): void {
    describe(feature, () => {
        scenarios.forEach(({ name, context, steps }) => {
            createJestTest(name, context ?? ({} as TContext), steps);
        });
    });
}

/**
 * Registra un scenario para ejecutarse en Jest
 * Alias para createJestTest
 */
export const it = createJestTest;

/**
 * Describe un scenario con un setup específico
 */
export function describeScenario<TContext extends TestContext>(
    description: string,
    setup: () => TContext,
    steps: ScenarioSteps<TContext>
): void {
    test(description, async () => {
        const initialContext = setup();
        createJestTest(description, initialContext, steps);
    });
}

/**
 * Hooks de Jest integrados con el DSL
 */
export const BDDHooks = {
    /**
     * Before each scenario - configurar mocks
     */
    beforeEach: (fn: (ctx: TestContext) => void | Promise<void>) => {
        beforeEach(async () => {
            const ctx = createTestContext();
            await fn(ctx);
        });
    },

    /**
     * After each scenario - limpiar recursos
     */
    afterEach: (fn: (ctx: TestContext) => void | Promise<void>) => {
        afterEach(async () => {
            const ctx = createTestContext();
            await fn(ctx);
        });
    },

    /**
     * Before all scenarios - setup global
     */
    beforeAll: (fn: (ctx: TestContext) => void | Promise<void>) => {
        beforeAll(async () => {
            const ctx = createTestContext();
            await fn(ctx);
        });
    },

    /**
     * After all scenarios - cleanup global
     */
    afterAll: (fn: (ctx: TestContext) => void | Promise<void>) => {
        afterAll(async () => {
            const ctx = createTestContext();
            await fn(ctx);
        });
    },
};

/**
 * Crea un test con múltiples assertions en el paso Then
 */
export function itShould<TContext extends TestContext>(
    description: string,
    setup: () => TContext | Promise<TContext>,
    assertions: { when?: StepFn<TContext>; then?: StepFn<TContext> }[]
): void {
    test(description, async () => {
        const initialContext = await setup();
        const ctx = createTestContext({
            initialData: initialContext.data,
            mocks: initialContext.mocks,
        });

        for (const { when, then } of assertions) {
            if (when) await (when as any)(ctx);
            if (then) await (then as any)(ctx);
        }
    });
}
