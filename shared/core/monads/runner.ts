import { BusinessFlow, Step, FlowContext, FlowReport, FlowError, StepType, IFlowRunner } from './monad.flow';

export type { FlowReport, FlowContext, FlowError, StepType };

type MiddlewareFn = (step: Step, data: unknown, next: () => Promise<unknown>) => Promise<unknown>;

interface RunnerOptions {
    middlewares?: MiddlewareFn[];
    deps?: Record<string, unknown>;
}

function isFlowLike(obj: unknown): obj is { flowName: string; run: (ctx: FlowContext) => Promise<FlowReport> } {
    return typeof obj === 'object' && obj !== null && 'flowName' in obj && 'run' in (obj as Record<string, unknown>);
}

function isBlockingStep(type: StepType): boolean {
    return type === 'RULE' || type === 'JOB';
}

export class FlowRunner implements IFlowRunner {
    private middlewares: MiddlewareFn[];
    private globalDeps: Record<string, unknown>;

    constructor(options: RunnerOptions = {}) {
        this.middlewares = options.middlewares || [];
        this.globalDeps = options.deps || {};
    }

    async run(flow: BusinessFlow<unknown>, parentContext: FlowContext = { path: '', deps: {} }): Promise<FlowReport> {
        const currentPath = parentContext.path ? `${parentContext.path}[${flow.name}]` : `[${flow.name}]`;

        const activeDeps: Record<string, unknown> = { ...this.globalDeps, ...parentContext.deps };
        for (const dep of flow.dependencies) {
            if (!dep.adapter) throw new Error(`[FATAL] Port ${dep.port} has no adapter in ${currentPath}`);
            activeDeps[dep.port] = dep.adapter;
        }

        const report: FlowReport = {
            flowName: flow.name,
            status: 'success',
            data: flow.data,
            errors: [],
            metrics: {}
        };

        for (const step of flow.steps) {
            const stepPath = `${currentPath}[${step.name}]`;
            const protectedData = this._createProtection(report.data);

            try {
                const executeWithMiddleware = async (index: number, data: unknown): Promise<unknown> => {
                    if (index < this.middlewares.length) {
                        return this.middlewares[index](step, data, () => executeWithMiddleware(index + 1, data));
                    }
                    if (step.type === 'SCOPE') {
                        return this.run(step.action as BusinessFlow, { path: currentPath, deps: activeDeps });
                    }
                    return (step.action as (data: unknown, deps: Record<string, unknown>) => unknown)(data, activeDeps);
                };

                const result = await executeWithMiddleware(0, protectedData);

                if (isFlowLike(result)) {
                    const subReport = await (result as { run: (ctx: FlowContext) => Promise<FlowReport> }).run({ path: stepPath, deps: activeDeps });
                    this._mergeReports(report, subReport);
                    if (report.status === 'failure') break;
                    report.data = subReport.data;
                } else {
                    this._processStepResult(step, result, report, stepPath);
                    if (report.status === 'failure' && isBlockingStep(step.type)) break;
                }

            } catch (error) {
                report.status = 'failure';
                report.errors.push({ path: stepPath, message: (error as Error).message, severity: step.type });
                break;
            }
        }

        return report;
    }

    private _createProtection(data: unknown): unknown {
        if (typeof data !== 'object' || data === null) return data;
        return new Proxy(data as Record<string, unknown>, {
            set(target: Record<string, unknown>, prop: string) {
                throw new Error(`[Architecture Violation] Attempted to mutate data at property "${prop}". Use job return instead.`);
            }
        });
    }

    private _processStepResult(step: Step, result: unknown, report: FlowReport, path: string): void {
        if (step.type === 'YIELD') {
            report.data = result;
            return;
        }

        const isFailure = result === false || (result && (result as Record<string, unknown>).error);
        if (isFailure) {
            const errorEntry: FlowError = {
                path,
                message: (result as { message?: string })?.message || `Validation failed: ${step.name}`,
                severity: step.type
            };
            report.errors.push(errorEntry);

            if (step.type === 'RULE' || step.type === 'JOB') {
                report.status = 'failure';
            } else {
                report.status = 'partial_failure';
            }
        } else if ((step.type === 'ACTION' || step.type === 'JOB') && result !== undefined) {
            report.data = result;
        }
    }

    private _mergeReports(parent: FlowReport, child: FlowReport): void {
        if (child.status === 'failure') parent.status = 'failure';
        else if (child.status === 'partial_failure' && parent.status === 'success') parent.status = 'partial_failure';
        parent.errors.push(...child.errors);
    }
}