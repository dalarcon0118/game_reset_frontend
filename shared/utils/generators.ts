// frontend/shared/utils/generators.ts

/**
 * Utilidades para trabajar con generadores async y composición de datos
 * Proporciona funciones reutilizables que usan yield * para mejor composabilidad
 */

/**
 * Tipo genérico para transformadores de datos
 */
export type DataTransformer<TInput, TOutput> = (input: TInput) => TOutput;

/**
 * Tipo para generadores async
 */
export type AsyncGeneratorType<T> = AsyncGenerator<T, void, unknown>;

/**
 * Tipo para funciones que transforman generadores
 */
export type GeneratorTransformer<TInput, TOutput> = (
    generator: AsyncGeneratorType<TInput>
) => AsyncGeneratorType<TOutput>;

/**
 * Tipo para funciones que convierten generador a Promise
 */
export type GeneratorFinalizer<TInput, TOutput> = (
    generator: AsyncGeneratorType<TInput>
) => Promise<TOutput>;

/**
 * Resultado del pipe - permite composición fluida y resolución con .await()
 */
export interface PipeResult<T> {
    /**
     * Ejecuta el pipeline y devuelve una Promise con el resultado
     * Uso: pipe(...).await() en lugar de await pipe(...)
     */
    await(): Promise<T>;

    /**
     * Ejecuta el pipeline y devuelve una Promise con un resultado seguro [Error, Data]
     * Uso: const [error, data] = await pipe(...).safeAwait()
     */
    safeAwait<E = Error>(): Promise<AsyncResult<T, E>>;

    /**
     * Continúa la composición con más operaciones
     */
    pipe(operation: (gen: AsyncGeneratorType<any>) => any): PipeResult<any>;
}

/**
 * Función utilitaria que encapsula el patrón de transformación con yield *
 * Reemplaza await con yield * para mejor composabilidad y eficiencia de memoria
 */
export async function* transformWithYield<TInput, TOutput>(
    generator: AsyncGeneratorType<TInput>,
    transformer: DataTransformer<TInput, TOutput>
): AsyncGeneratorType<TOutput> {
    for await (const item of generator) {
        yield transformer(item);
    }
}

/**
 * Combina múltiples generadores usando yield * (delegación)
 * Ventaja: Composabilidad - un generador puede delegar completamente a otros
 */
export async function* combineGenerators<T>(
    ...generators: AsyncGeneratorType<T>[]
): AsyncGeneratorType<T> {
    for (const generator of generators) {
        yield* generator; // yield * delega completamente al generador
    }
}

/**
 * Función específica para templates con status usando yield *
 * Demuestra cómo yield * reemplaza await en transformaciones
 */
export async function* transformTemplatesWithStatus<T extends { id: string }>(
    templateGenerator: AsyncGeneratorType<T>
): AsyncGeneratorType<T & { isActivated: boolean }> {
    // yield * delega la transformación, más eficiente que await
    yield* transformWithYield(
        templateGenerator,
        (template) => ({ ...template, isActivated: false })
    );
}

/**
 * Conversor de generador a array (para compatibilidad con APIs existentes)
 * Puente entre el mundo de generadores y APIs tradicionales
 */
export async function generatorToArray<T>(
    generator: AsyncGeneratorType<T>
): Promise<T[]> {
    const results: T[] = [];
    for await (const item of generator) {
        results.push(item);
    }
    return results;
}

/**
 * Procesamiento por lotes con generadores (streaming)
 * Útil para APIs que soportan paginación o procesamiento incremental
 */
export async function* batchProcess<T>(
    generator: AsyncGeneratorType<T>,
    batchSize: number
): AsyncGeneratorType<T[]> {
    let batch: T[] = [];

    for await (const item of generator) {
        batch.push(item);

        if (batch.length >= batchSize) {
            yield batch;
            batch = [];
        }
    }

    // Yield remaining items
    if (batch.length > 0) {
        yield batch;
    }
}

/**
 * Generador con timeout para evitar operaciones que tarden demasiado
 * Cada item debe procesarse dentro del timeout especificado
 */
export async function* withTimeout<T>(
    generator: AsyncGeneratorType<T>,
    timeoutMs: number
): AsyncGeneratorType<T> {
    for await (const item of generator) {
        // Crear una promesa que se resuelve con el item actual
        const itemPromise = Promise.resolve(item);

        // Carrera entre el procesamiento del item y el timeout
        const result = await Promise.race([
            itemPromise,
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error(`Generator timeout after ${timeoutMs}ms`)), timeoutMs)
            )
        ]);

        yield result;
    }
}

/**
 * Generador que permite cancelación vía AbortSignal
 * Demuestra control de flujo superior con generadores vs await
 */
export async function* cancellableGenerator<T>(
    generator: AsyncGeneratorType<T>,
    signal: AbortSignal
): AsyncGeneratorType<T> {
    const iterator = generator[Symbol.asyncIterator]();

    try {
        while (true) {
            if (signal.aborted) {
                break;
            }

            const result = await iterator.next();

            if (result.done) {
                break;
            }

            // Type assertion para resolver el error de tipos
            yield result.value as T;
        }
    } finally {
        // Cleanup si es necesario
        if (typeof iterator.return === 'function') {
            await iterator.return();
        }
    }
}

/**
 * Función pipe que devuelve PipeResult para composición sin await
 * Uso: pipe(generator, transform1, transform2).await()
 */
export function pipe<T = any>(
    initialGenerator: AsyncGeneratorType<any>,
    ...operations: ((gen: AsyncGeneratorType<any>) => any)[]
): PipeResult<T> {

    // Función interna que ejecuta el pipeline completo
    const executePipeline = async (): Promise<any> => {
        let current: any = initialGenerator;

        for (const operation of operations) {
            current = operation(current);
        }

        // Si el resultado es un generador, convertirlo a array
        if (current && typeof current[Symbol.asyncIterator] === 'function') {
            return generatorToArray(current);
        }

        return current;
    };

    // Función que ejecuta el pipeline y devuelve un resultado seguro [Error, Data]
    const executeSafePipeline = async (): Promise<AsyncResult<any, any>> => {
        try {
            const data = await executePipeline();
            return [null, data];
        } catch (error) {
            return [error as Error, null];
        }
    };

    // Función para continuar la composición
    const continuePipe = (nextOperation: (gen: AsyncGeneratorType<any>) => any): PipeResult<any> => {
        return pipe(initialGenerator, ...operations, nextOperation);
    };

    // Devolver objeto con métodos para composición
    return {
        await: executePipeline,
        safeAwait: executeSafePipeline,
        pipe: continuePipe
    };
}

/**
 * Método pipe para generadores - sintaxis fluida simple
 * Uso: addPipeMethod(generator).pipe(transform1).pipe(finalizer)
 */
export function addPipeMethod<T>(generator: AsyncGeneratorType<T>) {
    const pipedGenerator = generator as AsyncGeneratorType<T> & {
        pipe(operation: (gen: AsyncGeneratorType<any>) => any): any;
    };

    pipedGenerator.pipe = function (operation: (gen: AsyncGeneratorType<any>) => any) {
        return addPipeMethod(operation(generator));
    };

    return pipedGenerator;
}

// =====================================================================================
// FUNCIONES CURRY PARA MEJOR COMPOSICIÓN CON PIPE
// =====================================================================================

/**
 * Versión curry de transformTemplatesWithStatus para usar con pipe
 */
export const withStatus = <T extends { id: string }>(): GeneratorTransformer<
    T,
    T & { isActivated: boolean }
> => transformTemplatesWithStatus;

/**
 * Versión curry de generatorToArray para usar como finalizer en pipe
 */
export const toArray = <T>(): GeneratorFinalizer<T, T[]> => generatorToArray;

/**
 * Versión curry de batchProcess
 */
export const batch = <T>(batchSize: number): GeneratorTransformer<T, T[]> =>
    (generator) => batchProcess(generator, batchSize);

/**
 * Versión curry de withTimeout
 */
export const timeout = <T>(timeoutMs: number): GeneratorTransformer<T, T> =>
    (generator) => withTimeout(generator, timeoutMs);

/**
 * Versión curry de cancellableGenerator
 */
export const cancellable = <T>(signal: AbortSignal): GeneratorTransformer<T, T> =>
    (generator) => cancellableGenerator(generator, signal);

/**
 * Crea un generador async a partir de una función que devuelve una Promise<T[]>
 * Útil para integrar APIs tradicionales con el sistema de generadores
 */
export async function* createStream<T>(provider: () => Promise<T[]>): AsyncGenerator<T> {
    try {
        const items = await provider();
        for (const item of items) {
            yield item;
        }
    } catch (error) {
        // Propagar el error a través del generador
        throw error;
    }
}

/**
 * Helper para manejo de errores con Result types
 * Convierte Promise<T> a AsyncResult<T, E> para mejor manejo de errores
 */
export type AsyncResult<T, E = Error> = [E, null] | [null, T];

export async function to<T, E = Error>(
    promise: Promise<T>,
    ErrorClass: new (message?: string) => E = Error as any
): Promise<AsyncResult<T, E>> {
    try {
        const data = await promise;
        return [null, data];
    } catch (error) {
        const errorInstance = error instanceof ErrorClass
            ? error
            : new ErrorClass(error instanceof Error ? error.message : String(error));
        return [errorInstance, null];
    }
}

/**
 * Versión curry del helper `to` para usar en pipes
 */
export const toResult = <T, E = Error>(ErrorClass?: new (message?: string) => E) =>
    (promise: Promise<T>) => to(promise, ErrorClass);

