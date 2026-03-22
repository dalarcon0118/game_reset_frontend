/**
 * DSL de BDD con TEA - Scenario Builder
 * 
 * Permite escribir tests con un estilo fluido:
 * 
 * scenario('checkout happy path')
 *   .given(ctx => ctx.user.withProduct())
 *   .when(ctx => ctx.user.checkout())
 *   .then(ctx => ctx.expectOrderCreated())
 */

import { TestContext } from './context';
import { createJestTest } from './jest-adapter';

export type StepFn<TContext extends TestContext> = (ctx: TContext) => void | Promise<void>;

/**
 * Paso con descripción opcional
 */
export interface NamedStep<TContext> {
    description: string;
    fn: StepFn<TContext>;
}

/**
 * Tipos de callback para onSuccess y onFailed
 */
export type SuccessFn<TContext extends TestContext> = (ctx: TContext) => void | Promise<void>;
export type FailureFn<TContext extends TestContext> = (ctx: TContext, error: Error) => void | Promise<void>;

/**
 * Opciones de configuración para un Scenario
 */
export interface ScenarioConfig<TContext extends TestContext = TestContext> {
    /** Adaptador de vista a usar */
    viewAdapter?: any;
    /** Timeout para el test */
    timeout?: number;
    /** Tags para el test */
    tags?: string[];
    /** Callback cuando el test pasa exitosamente */
    onSuccess?: SuccessFn<TContext>;
    /** Callback cuando el test falla */
    onFailed?: FailureFn<TContext>;
}

/**
 * Pasos del escenario con descripciones
 */
interface ScenarioSteps<TContext> {
    given: NamedStep<TContext>[];
    when: NamedStep<TContext>[];
    then: NamedStep<TContext>[];
}

/**
 * ScenarioBuilderBase - Clase base con la lógica común
 * Evita duplicación entre ScenarioBuilder y DetoxScenarioBuilder
 */
export class ScenarioBuilderBase<TContext extends TestContext> {
    protected description: string;
    protected context: TContext;
    protected steps: ScenarioSteps<TContext> = {
        given: [],
        when: [],
        then: [],
    };
    protected config: ScenarioConfig = {};
    protected onSuccessCallback?: SuccessFn<TContext>;
    protected onFailedCallback?: FailureFn<TContext>;

    constructor(description: string, initialContext: TContext, config?: ScenarioConfig) {
        this.description = description;
        this.context = initialContext;
        this.config = config ?? {};
        this.onSuccessCallback = config?.onSuccess;
        this.onFailedCallback = config?.onFailed;
    }

    /**
     * Given - Prepara el estado inicial del escenario
     * Soporta: .given(fn) o .given('descripción', fn)
     */
    given(descriptionOrFn: string | StepFn<TContext>, maybeFn?: StepFn<TContext>): this {
        const step = this._parseStep(descriptionOrFn, maybeFn);
        this.steps.given.push(step);
        return this;
    }

    /**
     * When - Ejecuta la acción a probar
     * Soporta: .when(fn) o .when('descripción', fn)
     */
    when(descriptionOrFn: string | StepFn<TContext>, maybeFn?: StepFn<TContext>): this {
        const step = this._parseStep(descriptionOrFn, maybeFn);
        this.steps.when.push(step);
        return this;
    }

    /**
     * Then - Verifica el resultado esperado
     * Soporta: .then(fn) o .then('descripción', fn)
     */
    then(descriptionOrFn: string | StepFn<TContext>, maybeFn?: StepFn<TContext>): this {
        const step = this._parseStep(descriptionOrFn, maybeFn);
        this.steps.then.push(step);
        return this;
    }

    /**
     * And - Añade un paso adicional (determina el tipo automáticamente)
     * Soporta: .and(fn) o .and('descripción', fn)
     */
    and(descriptionOrFn: string | StepFn<TContext>, maybeFn?: StepFn<TContext>): this {
        const step = this._parseStep(descriptionOrFn, maybeFn);
        if (this.steps.then.length > 0) {
            this.steps.then.push(step);
            return this;
        } else if (this.steps.when.length > 0) {
            this.steps.when.push(step);
            return this;
        }
        this.steps.given.push(step);
        return this;
    }

    /**
     * Parsea el argumento para obtener descripción y función
     */
    private _parseStep(descriptionOrFn: string | StepFn<TContext>, maybeFn?: StepFn<TContext>): NamedStep<TContext> {
        if (typeof descriptionOrFn === 'string' && maybeFn) {
            return { description: descriptionOrFn, fn: maybeFn };
        }
        // Generar descripción automática si solo se pasa la función
        const fn = descriptionOrFn as StepFn<TContext>;
        const fnName = fn.name || 'anonymous';
        return { description: fnName, fn };
    }

    /**
     * Ejecuta todos los pasos en orden con logging de descripciones
     */
    async runSteps(ctx: TContext): Promise<void> {
        for (const step of this.steps.given) {
            console.log(`  ✓ given: ${step.description}`);
            await step.fn(ctx);
        }
        for (const step of this.steps.when) {
            console.log(`  ✓ when: ${step.description}`);
            await step.fn(ctx);
        }
        for (const step of this.steps.then) {
            console.log(`  ✓ then: ${step.description}`);
            await step.fn(ctx);
        }
    }

    /**
     * Obtiene los pasos para pasar al jest-adapter
     */
    getSteps() {
        return this.steps;
    }

    /**
     * Ejecuta todos los pasos en orden (usando el contexto interno)
     */
    async run(): Promise<TContext> {
        await this.runSteps(this.context);
        return this.context;
    }

    /**
     * onSuccess - Callback cuando el test pasa
     */
    onSuccess(fn: SuccessFn<TContext>): this {
        this.onSuccessCallback = fn;
        return this;
    }

    /**
     * onFailed - Callback cuando el test falla
     */
    onFailed(fn: FailureFn<TContext>): this {
        this.onFailedCallback = fn;
        return this;
    }
}

/**
 * ScenarioBuilder - Constructor fluido para escenarios de BDD (Jest)
 */
export class ScenarioBuilder<TContext extends TestContext> extends ScenarioBuilderBase<TContext> {
    constructor(description: string, initialContext: TContext, config?: ScenarioConfig) {
        super(description, initialContext, config);
    }

    /**
     * Crea un test de Jest con este escenario
     */
    test(): void {
        createJestTest(
            this.description,
            this.context,
            {
                steps: this.steps,
                onSuccess: this.onSuccessCallback,
                onFailed: this.onFailedCallback
            } as any,
            this.config.timeout
        );
    }
}

/**
 * Crea un nuevo escenario BDD para Jest
 */
export function scenario<TContext extends TestContext>(
    description: string,
    initialContext?: TContext,
    config?: ScenarioConfig
): ScenarioBuilder<TContext> {
    const ctx = initialContext ?? ({} as TContext);
    return new ScenarioBuilder<TContext>(description, ctx, config);
}

/**
 * Crea un escenario que se registra automáticamente en Jest
 */
export function it<TContext extends TestContext>(
    description: string,
    buildScenario: (ctx: TContext) => {
        given?: StepFn<TContext>;
        when?: StepFn<TContext>;
        then?: StepFn<TContext>;
    }
): void {
    const ctx = {} as TContext;
    const { given, when, then } = buildScenario(ctx);
    createJestTest(description, ctx, { given, when, then });
}
