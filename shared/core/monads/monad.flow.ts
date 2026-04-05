export type StepType = 'SCOPE' | 'RULE' | 'CHECK' | 'ACTION' | 'JOB' | 'YIELD';

export interface Step {
    type: StepType;
    name: string;
    action: unknown;
}

export interface Dependency {
    port: string;
    adapter: unknown;
}

export interface FlowMetadata {
    traceId: string;
    [key: string]: unknown;
}

export interface IFlowRunner {
    run(flow: BusinessFlow<unknown>, parentContext?: FlowContext): Promise<FlowReport>;
}

export interface FlowContext {
    path: string;
    deps: Record<string, unknown>;
}

export interface FlowReport {
    flowName: string;
    status: 'success' | 'partial_failure' | 'failure';
    data: unknown;
    errors: FlowError[];
    metrics: Record<string, number>;
}

export interface FlowError {
    path: string;
    message: string;
    severity: StepType;
}

export class BusinessFlow<T = unknown> {
    name: string;
    data: T;
    steps: Step[];
    dependencies: Dependency[];
    metadata: FlowMetadata;

    constructor(name: string, data: unknown, steps: Step[] = [], dependencies: Dependency[] = [], metadata: FlowMetadata = { traceId: '' }) {
        this.name = name;
        this.data = data as T;
        this.steps = steps;
        this.dependencies = dependencies;
        this.metadata = metadata.traceId ? metadata : { ...metadata, traceId: metadata.traceId || crypto.randomUUID() };
    }

    static init<T>(name: string, data: T, meta: FlowMetadata = { traceId: '' }): BusinessFlow<T> {
        return new BusinessFlow<T>(name, data, [], [], meta);
    }

    requires(portName: string, adapter: unknown): BusinessFlow<T> {
        return new BusinessFlow<T>(
            this.name,
            this.data,
            this.steps,
            [...this.dependencies, { port: portName, adapter }],
            this.metadata
        );
    }

    scope<TScope>(name: string, callback: (subFlow: BusinessFlow<T>) => BusinessFlow<TScope>): BusinessFlow<TScope> {
        const subFlow = callback(new BusinessFlow<T>(name, this.data));
        return this._addStep<TScope>('SCOPE', name, subFlow as unknown) as BusinessFlow<TScope>;
    }

    rule(name: string, predicate: (data: T) => boolean): BusinessFlow<T> {
        return this._addStep('RULE', name, predicate);
    }

    check(name: string, predicate: (data: T) => boolean): BusinessFlow<T> {
        return this._addStep('CHECK', name, predicate);
    }

    action<TOut>(name: string, fn: (data: T) => TOut): BusinessFlow<TOut> {
        return this._addStep('ACTION', name, fn) as unknown as BusinessFlow<TOut>;
    }

    job<TOut>(name: string, fn: (data: T, deps: Record<string, unknown>) => TOut | Promise<TOut>): BusinessFlow<TOut> {
        return this._addStep('JOB', name, fn) as unknown as BusinessFlow<TOut>;
    }

    step(name: string, fn: (data: unknown, deps: Record<string, unknown>) => unknown): BusinessFlow<unknown> {
        return this._addStep('JOB', name, fn);
    }

    yield<TOut>(mappingFn: (data: T) => TOut): BusinessFlow<TOut> {
        return this._addStep('YIELD', 'Final Projection', mappingFn) as unknown as BusinessFlow<TOut>;
    }

    private _addStep<TOut>(type: StepType, name: string, action: Step['action']): BusinessFlow<TOut> {
        return new BusinessFlow<TOut>(
            this.name,
            this.data,
            [...this.steps, { type, name, action }],
            this.dependencies,
            this.metadata
        );
    }

    must(name: string, predicate: (data: T) => boolean): BusinessFlow<T> {
        return this.rule(name, predicate);
    }

    validate(name: string, predicate: (data: T) => boolean): BusinessFlow<T> {
        return this.check(name, predicate);
    }

    pureTask<TOut>(name: string, fn: (data: T) => TOut): BusinessFlow<TOut> {
        return this.action(name, fn);
    }

    impureTask<TOut>(name: string, fn: (data: T, deps: Record<string, unknown>) => TOut | Promise<TOut>): BusinessFlow<TOut> {
        return this.job(name, fn);
    }

    task(name: string, fn: (data: unknown, deps: Record<string, unknown>) => unknown): BusinessFlow<unknown> {
        return this.step(name, fn);
    }
}

export interface ValidationResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export type SchemaValidator<T> = (data: unknown) => ValidationResult<T>;

export interface PhaseFlowConfig<TDeps extends Record<string, unknown> = Record<string, unknown>> {
    dataPhase: <T>(data: T) => PhaseData<T, TDeps>;
}

export interface PhaseData<T, TDeps extends Record<string, unknown>> {
    data: T;
    deps: TDeps;
    validators: { name: string; predicate: (data: T) => boolean }[];
    addValidator(name: string, predicate: (data: T) => boolean): PhaseData<T, TDeps>;
    run(validators?: { name: string; predicate: (data: T) => boolean }[]): ValidationResult<T>;
}

export function createPhaseData<T, TDeps extends Record<string, unknown>>(data: T, deps: TDeps): PhaseData<T, TDeps> {
    const validators: { name: string; predicate: (data: T) => boolean }[] = [];

    return {
        data,
        deps,
        validators,
        addValidator(name: string, predicate: (data: T) => boolean) {
            validators.push({ name, predicate });
            return this;
        },
        run(additionalValidators = []) {
            const allValidators = [...validators, ...additionalValidators];
            for (const v of allValidators) {
                if (!v.predicate(this.data)) {
                    return { success: false, error: `Validation failed: ${v.name}` };
                }
            }
            return { success: true, data: this.data };
        }
    };
}

export interface ActionChain<T> {
    action<TOut>(name: string, fn: (data: T) => TOut): ActionChain<TOut>;
    check(name: string, predicate: (data: T) => boolean): ActionChain<T>;
    rule(name: string, predicate: (data: T) => boolean): ActionChain<T>;
    job<TOut>(name: string, fn: (data: T, deps: Record<string, unknown>) => TOut | Promise<TOut>): ActionChain<TOut>;
    scope<TScope>(name: string, callback: (ctx: { data: T; deps: Record<string, unknown> }) => ActionChain<TScope>): ActionChain<TScope>;
    yield<TOut>(fn: (data: T) => TOut): ActionChain<TOut>;
    toFlow(name: string): BusinessFlow<T>;
}

function createActionChain<T>(name: string, data: T, deps: Record<string, unknown>, steps: Step[]): ActionChain<T> {
    const chain: ActionChain<T> = {
        action<TOut>(actionName: string, fn: (data: T) => TOut): ActionChain<TOut> {
            const newData = fn(data);
            return createActionChain<TOut>(name, newData, deps, [...steps, { type: 'ACTION', name: actionName, action: fn }]);
        },

        check(checkName: string, predicate: (data: T) => boolean): ActionChain<T> {
            return createActionChain<T>(name, data, deps, [...steps, { type: 'CHECK', name: checkName, action: predicate }]);
        },

        rule(ruleName: string, predicate: (data: T) => boolean): ActionChain<T> {
            return createActionChain<T>(name, data, deps, [...steps, { type: 'RULE', name: ruleName, action: predicate }]);
        },

        job<TOut>(jobName: string, fn: (data: T, deps: Record<string, unknown>) => TOut | Promise<TOut>): ActionChain<TOut> {
            return createActionChain<TOut>(name, fn(data, deps) as TOut, deps, [...steps, { type: 'JOB', name: jobName, action: fn }]);
        },

        scope<TScope>(scopeName: string, callback: (ctx: { data: T; deps: Record<string, unknown> }) => ActionChain<TScope>): ActionChain<TScope> {
            const subChain = callback({ data, deps });
            const subFlow = subChain.toFlow(scopeName);
            return createActionChain<TScope>(name, (subChain as unknown as { data: TScope }).data, deps, [...steps, { type: 'SCOPE', name: scopeName, action: subFlow }]);
        },

        yield<TOut>(fn: (data: T) => TOut): ActionChain<TOut> {
            const newData = fn(data);
            return createActionChain<TOut>(name, newData, deps, [...steps, { type: 'YIELD', name: 'Final Projection', action: fn }]);
        },

        toFlow(flowName: string): BusinessFlow<T> {
            return new BusinessFlow<T>(flowName, data, steps, []);
        }
    };

    return chain;
}

export function flow<T>(name: string, initialData: T): ActionChain<T> {
    return createActionChain<T>(name, initialData, {}, []);
}

export function phaseFlow<TData, TDeps extends Record<string, unknown> = Record<string, unknown>>(
    name: string,
    initialData: TData,
    deps: TDeps
) {
    const validationResults: { name: string; predicate: (data: TData) => boolean }[] = [];
    const actions: { name: string; fn: (data: TData) => TData }[] = [];
    const effects: { name: string; fn: (data: TData, deps: Record<string, unknown>) => Promise<TData> }[] = [];
    let projection: ((data: TData) => unknown) = (d) => d;

    return {
        check(name: string, predicate: (data: TData) => boolean) {
            validationResults.push({ name, predicate });
            return this;
        },

        action(name: string, fn: (data: TData) => TData) {
            actions.push({ name, fn });
            return this;
        },

        effect(name: string, fn: (data: TData, deps: Record<string, unknown>) => Promise<TData>) {
            effects.push({ name, fn });
            return this;
        },

        project<TOut>(fn: (data: TData) => TOut) {
            projection = fn;
            return this;
        },

        async run(): Promise<{ data: unknown; status: 'success' | 'failure' | 'partial_failure'; errors: string[] }> {
            let currentData = initialData;
            const errors: string[] = [];

            for (const check of validationResults) {
                if (!check.predicate(currentData)) {
                    errors.push(`Check failed: ${check.name}`);
                }
            }

            if (errors.length > 0) {
                return { data: projection(currentData), status: 'failure', errors };
            }

            for (const { name, fn } of actions) {
                currentData = fn(currentData);
            }

            for (const { name, fn } of effects) {
                try {
                    currentData = await fn(currentData, deps);
                } catch (e) {
                    errors.push(`Effect failed: ${name} - ${(e as Error).message}`);
                }
            }

            return {
                data: projection(currentData),
                status: errors.length === 0 ? 'success' : 'partial_failure',
                errors
            };
        },

        toFlow(): BusinessFlow<TData> {
            let bf = BusinessFlow.init(name, initialData);
            for (const check of validationResults) {
                bf = bf.check(check.name, check.predicate);
            }
            for (const { name, fn } of actions) {
                bf = bf.action(name, fn);
            }
            for (const { name, fn } of effects) {
                bf = bf.job(name, fn);
            }
            bf = bf.yield(projection) as unknown as BusinessFlow<TData>;
            return bf;
        }
    };
}