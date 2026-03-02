/**
 * Mediator Types - Improved with proper context for onRegister
 */

import { Cmd } from '../cmd';

/**
 * Store registration info - passed to onRegister
 */
export interface StoreRegistration {
    /** Unique store identifier */
    storeId: string;
    /** Store instance */
    store: any;
    /** Message types this store can handle */
    messageTypes: string[];
}

/**
 * Resolver: callbacks para conectar mediator con arquitectura TEA
 * 
 * El resolver es el "pegamento" entre el mediator y la arquitectura TEA.
 * Debe manejar el ciclo de vida completo de los mensajes.
 */
export interface TeaResolver<Store = any> {
    /** 
     * Se llama cuando se registra un store
     * AHORA recibe toda la información necesaria
     */
    onRegister?: (registration: StoreRegistration) => void;

    /** 
     * Se llama cuando se envía un mensaje - el resolver busca quién lo procesa 
     * Retorna el store que debe manejar el mensaje
     */
    onSend?: (msg: MsgWithCorrelation) => Store | null;

    /** 
     * Se llama cuando llega una respuesta
     * Retorna el store original que espera la respuesta
     */
    onReply?: (msg: MsgWithCorrelation) => Store | null;

    /**
     * Inicializar el resolver con el contexto necesario
     */
    init?: (context: ResolverContext<Store>) => void;
}

/**
 * Contexto que se le pasa al resolver
 */
export interface ResolverContext<Store = any> {
    /** Dispatch global */
    dispatch: (msg: any) => void;
    /** Obtener store por ID */
    getStore: (id: string) => Store | null;
}

/**
 * Mensaje con metadata para correlación
 */
export type MsgWithCorrelation = {
    correlationId?: string;
    replyTo?: string;
    responseTo?: string;
    /** El store ID que inició el mensaje (para routing de respuesta) */
    originStoreId?: string;
} & Record<string, any>;

/**
 * Tipo de mensaje esperado en respuesta
 */
export type ResponseType = { type: string };

/**
 * Interfaz del TeaMediator
 */
export interface TeaMediator<Store = any> {
    /** Nombre del mediator */
    readonly name: string;

    /** Inicializar el mediator con un dispatch global */
    init(dispatch: (msg: any) => void): void;

    /** 
     * Registrar un store con sus message types
     * Es decir: "este store maneja estos mensajes"
     */
    register(
        storeId: string,
        factory: () => Store,
        messageTypes: string[]
    ): void;

    /** 
     * Registrar los tipos de mensaje que este mediator puede procesar 
     * (para validación)
     */
    registerMsg(types: { type: string }[]): void;

    /** Verificar si hay un store que puede procesar este mensaje */
    canHandle(msg: { type: string }): boolean;

    /** Verificar si hay un store registrado */
    has(storeId: string): boolean;

    /** Obtener store por ID */
    get(storeId: string): Store | null;

    /** Lista de stores registrados */
    keys(): string[];

    /** Tipos de mensaje que puede procesar */
    handledMsgTypes(): string[];

    /** 
     * Enviar mensaje - el resolver encuentra el store apropiado
     * @param msg Mensaje a enviar
     * @param responseType Tipo de mensaje esperado en respuesta
     * @param originStoreId ID del store que envía (para routing de respuesta)
     */
    send(
        msg: MsgWithCorrelation,
        responseType: ResponseType,
        originStoreId?: string
    ): Cmd;

    /** 
     * Responder usando correlation ID
     * @param response Mensaje de respuesta
     */
    sendReply(response: MsgWithCorrelation): Cmd;

    /** Cleanup */
    destroy(): void;
}

/**
 * Payload para el comando MEDIATOR_SEND
 */
export interface MediatorSendPayload {
    mediatorName: string;
    msg: MsgWithCorrelation;
    correlationId: string;
    responseType: string;
    originStoreId?: string;
}

/**
 * Payload para el comando MEDIATOR_REPLY
 */
export interface MediatorReplyPayload {
    mediatorName: string;
    response: MsgWithCorrelation;
    correlationId: string;
}

/**
 * Configuración del Mediator
 */
export interface MediatorConfig {
    /** Timeout por defecto para respuestas (ms) */
    defaultTimeout?: number;
    /** Habilitar logging */
    debug?: boolean;
}
