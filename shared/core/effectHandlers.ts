import { router } from 'expo-router';
import { Cmd } from './cmd';
import apiClient from '../services/ApiClient';
export interface TaskPayload {
    task: (...args: any[]) => Promise<any>,
    args?: any[],
    onSuccess: (data: any) => any,
    onFailure: (error: any) => any
}
export interface AttemptPayload {
    task: (...args: any[]) => Promise<[any, any]>,
    args?: any[],
    onSuccess: (data: any) => any,
    onFailure: (error: any) => any
}
export interface HttpPayload {
    url: string;
    method: string;
    body?: any;
    headers?: Record<string, string>;
    msgCreator?: any;
}
export const effectHandlers = {
    'HTTP': async (payload: HttpPayload) => {
        const { url, method, body, headers } = payload;

        // El apiClient ya tiene los interceptores para inyectar el Token
        // y manejar la renovación del mismo.
        try {
            const response = await apiClient.request(url, {
                method,
                body: body,
                headers: headers // Puedes mezclar headers específicos con los globales
            });
            return response;
        } catch (error) {
            // Aquí podrías normalizar el error antes de devolverlo
            throw error;
        }
    },
    'TASK': async (payload: TaskPayload, dispatch: (cmd: Cmd) => void) => {
        const { task, args, onSuccess, onFailure } = payload;

        try {
            // Ejecutamos la tarea (servicio)
            const result = await task(...(args || []));
            // Si tiene éxito, disparamos el mensaje de éxito
            dispatch(onSuccess(result));
        } catch (error) {
            // Si falla, disparamos el mensaje de error
            dispatch(onFailure(error));
        }
    },
    'ATTEMPT': async (payload: AttemptPayload, dispatch: (cmd: Cmd) => void) => {
        const { task, args, onSuccess, onFailure } = payload;

        try {
            // Ejecutamos la tarea que devuelve [error, data]
            const [error, data] = await task(...(args || []));

            if (error) {
                dispatch(onFailure(error));
            } else {
                dispatch(onSuccess(data));
            }
        } catch (error) {
            // Error inesperado fuera del safeAwait
            dispatch(onFailure(error));
        }
    },
    'NAVIGATE': async (payload: { pathname: string, params?: Record<string, any>, method?: 'push' | 'replace' | 'back' }) => {
        const { pathname, params, method = 'push' } = payload;

        if (method === 'back') {
            router.back();
            return;
        }

        if (method === 'replace') {
            router.replace({ pathname: pathname as any, params });
        } else {
            router.push({ pathname: pathname as any, params });
        }
    }
};
