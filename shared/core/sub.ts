/**
 * Definición de Subscriptions (Sub) para la arquitectura TEA.
 * Permite escuchar eventos externos de forma declarativa basándose en el estado del Modelo.
 */

export type SubType = 'NONE' | 'EVERY' | 'BATCH';

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
    })
};
