import { Task } from './task';
import { TaskRuntime } from './task-runtime';
import { ReaderTask } from './reader-task';
import { TaskTEA } from './task-tea';
import { Result } from './algebraic-types';

/**
 * task.example.ts
 * 
 * Guía práctica para el uso de la nueva infraestructura monádica en el proyecto.
 * Esta arquitectura separa la lógica pura (Task) de la orquestación (Runtime),
 * la inyección de dependencias (ReaderTask) y la integración con TEA (TaskTEA).
 */

// ============================================================================
// 1. TASK (Mónada Pura)
// ============================================================================
// Responsabilidad: Definir computaciones perezosas y componibles.

const simpleTask = Task.succeed(42);

const chainedTask = simpleTask
    .map(n => n * 2)
    .andThen(n => Task.fromSync(() => n + 10))
    .tap(val => console.log('Valor actual:', val));

// Nota: Nada ha ocurrido todavía. Solo se han definido los pasos.


// ============================================================================
// 2. TASK RUNTIME (Orquestación)
// ============================================================================
// Responsabilidad: Resiliencia, paralelismo y control de tiempo.

const apiTask = Task.fromPromise(async (sig) => {
    // sig es un AbortSignal inyectado automáticamente por el runtime
    const response = await fetch('https://api.example.com/data', { signal: sig });
    return response.json();
});

// Añadiendo robustez:
const resilientTask = TaskRuntime.retry(
    { attempts: 3, backoff: 'exponential', delay: 1000 },
    TaskRuntime.timeout(5000, new Error('API Timeout'), apiTask)
);

// Ejecución en paralelo (falla al primer error):
const parallelTask = TaskRuntime.parallel([
    resilientTask,
    Task.succeed('Other data')
]);


// ============================================================================
// 3. READER TASK (Inyección de Dependencias)
// ============================================================================
// Responsabilidad: Desacoplar la lógica de las dependencias concretas.

interface Dependencies {
    storage: { save: (id: string, data: any) => Promise<void> };
    logger: { info: (msg: string) => void };
}

const saveUserTask = (id: string, data: any): ReaderTask<Dependencies, Error, string> =>
    ReaderTask.asks(({ storage, logger }) =>
        Task.fromPromise(() => storage.save(id, data))
            .tap(() => logger.info(`User ${id} saved`))
            .map(() => 'Success')
    );

// El "Handler" inyectaría las dependencias reales:
// const result = await saveUserTask('1', { name: 'Dev' }).run(realDeps).fork();


// ============================================================================
// 4. TASK TEA (Integración con Arquitectura Elm)
// ============================================================================
// Responsabilidad: Puente entre la lógica funcional y el ciclo de vida de React/Zustand.

// En tu función update.ts:
const update = (msg: any, model: any) => {
    switch (msg.type) {
        case 'FETCH_DATA':
            return [
                { ...model, loading: true },
                // TaskTEA.attempt mapea el Result final a un mensaje
                TaskTEA.attempt(
                    (result) => ({ type: 'DATA_RECEIVED', payload: result }),
                    resilientTask,
                    'FetchData'
                )
            ];

        case 'LOG_EVENT':
            return [
                model,
                // TaskTEA.perform se usa para tareas que nunca fallan
                TaskTEA.perform(
                    () => ({ type: 'EVENT_LOGGED' }),
                    Task.fromSync(() => console.log('Event tracked'))
                )
            ];
    }
};

/**
 * RESUMEN DE FLUJO:
 * 1. Definir la lógica atómica en Task.
 * 2. Componer flujos complejos con ReaderTask si necesitas DI.
 * 3. Añadir capas de resiliencia con TaskRuntime.
 * 4. Disparar el efecto desde el Update usando TaskTEA.
 */