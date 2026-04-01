import { Result } from './algebraic-types';
import { Task } from './task';
import { CommandDescriptor } from './tea-utils/cmd';

/**
 * TaskTEA - Integración de Task con la arquitectura TEA
 *
 * Puente entre la mónada Task pura y el sistema de comandos TEA.
 * Responsabilidad única: ejecutar Tasks y mapear resultados a mensajes.
 */

export const TaskTEA = {
    /**
     * Ejecuta una Task que puede fallar y mapea el Result a un mensaje.
     * Equivale a Elm's Task.attempt.
     *
     * @example
     * TaskTEA.attempt(
     *     (result) => result.isOk() ? Msg.loaded(result.right) : Msg.loadFailed(result.left),
     *     Task.fromPromise(() => fetchUser())
     * )
     */
    attempt: <E, A, Msg>(
        toMsg: (result: Result<E, A>) => Msg,
        task: Task<E, A>,
        label?: string
    ): CommandDescriptor => ({
        type: 'TASK',
        payload: {
            task: () => task.fork().then(toMsg),
            onSuccess: (msg: Msg) => msg,
            onFailure: (e: unknown) => toMsg(Result.error(e as E)),
            label: label || 'TaskTEA.attempt'
        }
    }),

    /**
     * Ejecuta una Task que nunca falla y mapea el valor a un mensaje.
     * Equivale a Elm's Task.perform.
     *
     * @example
     * TaskTEA.perform(
     *     (now) => Msg.currentTime(now),
     *     Task.fromSync(() => Date.now())
     * )
     */
    perform: <A, Msg>(
        toMsg: (value: A) => Msg,
        task: Task<never, A>,
        label?: string
    ): CommandDescriptor => ({
        type: 'TASK',
        payload: {
            task: () => task.fork().then(res => {
                if (res.isOk()) return toMsg(res.value);
                throw new Error('TaskTEA.perform: task failed unexpectedly');
            }),
            onSuccess: (msg: Msg) => msg,
            onFailure: (e: unknown) => ({ type: 'TASK_PERFORM_UNEXPECTED_ERROR', error: e }),
            label: label || 'TaskTEA.perform'
        }
    }),

    /**
     * Ejecuta una Task y despacha mensajes separados para éxito y error.
     * Atajo para el pattern común en handlers.
     *
     * @example
     * TaskTEA.dispatch(
     *     Task.fromPromise(() => placeBet(data)),
     *     (result) => Msg.betPlaced(result),
     *     (error) => Msg.betFailed(error),
     *     'placeBet'
     * )
     */
    dispatch: <E, A, Msg>(
        task: Task<E, A>,
        onSuccess: (value: A) => Msg,
        onFailure: (error: E) => Msg,
        label?: string
    ): CommandDescriptor => ({
        type: 'TASK',
        payload: {
            task: () => task.fork().then(res =>
                res.isOk() ? onSuccess(res.value) : onFailure(res.error)
            ),
            onSuccess: (msg: Msg) => msg,
            onFailure: (e: unknown) => onFailure(e as E),
            label: label || 'TaskTEA.dispatch'
        }
    })
};
