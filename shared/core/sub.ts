/**
 * Definición de Subscriptions (Sub) para la arquitectura TEA.
 * Permite escuchar eventos externos de forma declarativa basándose en el estado del Modelo.
 */

export type SubType = 'NONE' | 'EVERY' | 'BATCH' | 'WATCH_STORE' | 'SSE' | 'EVENT' | 'CUSTOM' | 'KERNEL_HANDLER';

export interface SubDescriptor<Msg> {
    type: SubType;
    payload?: any;
}

export const Sub = {
    /**
     * Permite crear una subscripción personalizada con lógica imperativa.
     * Útil para APIs que no encajan en los otros tipos (ej: Firebase, Offline Services).
     * @param subscribe Función que recibe dispatch y retorna una función de limpieza.
     * @param id Identificador único para la subscripción.
     */
    custom: <Msg>(
        subscribe: (dispatch: (msg: Msg) => void) => () => void,
        id: string
    ): SubDescriptor<Msg> => ({
        type: 'CUSTOM',
        payload: { subscribe, id }
    }),
    /**
     * Representa la ausencia de subscripciones.
     */
    none: <Msg>(): SubDescriptor<Msg> => ({
        type: 'NONE'
    }),

    /**
     * Crea una subscripción que escucha eventos de un stream SSE.
     * @param url La URL del endpoint SSE.
     * @param msgCreator Función que crea un mensaje a partir del evento recibido.
     * @param id Identificador único para la subscripción.
     * @param headers Opciones de cabecera para la petición.
     */
    sse: <Msg>(
        url: string,
        msgCreator: (data: any) => Msg,
        id: string,
        headers?: Record<string, string>
    ): SubDescriptor<Msg> => ({
        type: 'SSE',
        payload: { url, msgCreator, id, headers }
    }),

    /**
     * Crea una subscripción que dispara un mensaje cada cierto intervalo de tiempo.
     * @param ms Milisegundos entre cada disparo.
     * @param msg El mensaje a despachar.
     * @param id Un identificador único para esta subscripción (necesario para el diffing).
     */
    every: <Msg>(ms: number, msg: Msg, id: string): SubDescriptor<Msg> => ({
        type: 'EVERY',
        payload: { ms, msg, id }
    }),

    /**
     * Agrupa múltiples subscripciones en una sola.
     */
    batch: <Msg>(subs: SubDescriptor<Msg>[]): SubDescriptor<Msg> => ({
        type: 'BATCH',
        payload: subs.filter(s => s.type !== 'NONE')
    }),

    /**
     * Observa cambios en un store externo de Zustand.
     * @param store El store de Zustand a observar.
     * @param selector Función para seleccionar la parte del estado a observar.
     * @param msgCreator Función que crea un mensaje a partir del valor seleccionado.
     * @param id Identificador único para la subscripción.
     */
    watchStore: <Msg, TState, TSelected>(
        store: any,
        selector: (state: TState) => TSelected,
        msgCreator: (selected: TSelected) => Msg,
        id: string
    ): SubDescriptor<Msg> => ({
        type: 'WATCH_STORE',
        payload: { store, selector, msgCreator, id }
    }),

    /**
     * Crea una subscripción que escucha eventos externos usando objetos TEA-agnósticos.
     * @param event Descriptor del evento (objeto TEA-agnóstico).
     * @param target Origen del evento (puede ser una función que retorna el target).
     * @param msgCreator Función que crea un mensaje a partir del evento recibido.
     * @param id Identificador único para la subscripción.
     */
    watchEvent: <Msg>(
        event: any,
        target: any | (() => any),
        msgCreator: (event: any) => Msg,
        id: string
    ): SubDescriptor<Msg> => ({
        type: 'EVENT',
        payload: { event, target, msgCreator, id }
    }),

    /**
     * Delega la creación de la suscripción al Kernel.
     * Esto permite que los features soliciten suscripciones abstractas (ej: 'AUTH_SYNC')
     * sin conocer los detalles de implementación (ej: qué store usar).
     * 
     * @param handlerId El ID del handler registrado en el Kernel.
     * @param params Parámetros necesarios para el handler (ej: map de mensajes).
     * @param id Identificador único para esta instancia de suscripción.
     */
    kernel: <Msg>(
        handlerId: string,
        params: any,
        id: string
    ): SubDescriptor<Msg> => ({
        type: 'KERNEL_HANDLER',
        payload: { handlerId, params, id }
    })
};
