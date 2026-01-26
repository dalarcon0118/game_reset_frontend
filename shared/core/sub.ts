/**
 * Definición de Subscriptions (Sub) para la arquitectura TEA.
 * Permite escuchar eventos externos de forma declarativa basándose en el estado del Modelo.
 */

export type SubType = 'NONE' | 'EVERY' | 'BATCH' | 'WATCH_STORE' | 'SSE';

export interface SubDescriptor<Msg> {
    type: SubType;
    payload?: any;
}

export const Sub = {
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
    })
};
