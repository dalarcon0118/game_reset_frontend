/**
 * Definición de Subscriptions (Sub) para la arquitectura TEA.
 * Permite escuchar eventos externos de forma declarativa basándose en el estado del Modelo.
 */

import { MsgCreator } from './msg';

export type SubType = 'NONE' | 'EVERY' | 'BATCH' | 'WATCH_STORE' | 'SSE' | 'EVENT' | 'CUSTOM' | 'RECEIVE_MSG';

export interface SubDescriptor<Msg> {
    type: SubType;
    payload?: any;
}

export const Sub = {
    /**
     * Suscribe el store a un mensaje global (broadcast) enviado vía Cmd.sendMsg.
     * Útil para comunicación desacoplada entre módulos.
     * @param signal El creador de mensaje global (Signal) a escuchar.
     * @param handler Función que recibe el payload global y el dispatch interno.
     * @param id Identificador único para la subscripción.
     */
    receiveMsg: <Msg, P>(
        signal: MsgCreator<string, P>,
        handler: (payload: P, dispatch: (msg: Msg) => void) => void,
        id: string
    ): SubDescriptor<Msg> => ({
        type: 'RECEIVE_MSG',
        payload: { signal, handler, id }
    }),

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
     * @param store El store de Zustand a observar, o un string con el ID registrado en StoreRegistry.
     * @param selector Función para seleccionar la parte del estado a observar.
     * @param msgCreator Función que crea un mensaje a partir del valor seleccionado.
     * @param id Identificador único para la subscripción.
     */
    watchStore: <Msg, TState, TSelected>(
        store: any | string,
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
    })
};
