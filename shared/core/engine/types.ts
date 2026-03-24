/**
 * Tipos centrales del Motor TEA (The Elm Architecture)
 * Extracción de tipos desde engine.ts para mejorar mantenibilidad
 */

import { Cmd } from '../tea-utils/cmd';
import { SubDescriptor } from '../tea-utils/sub';
import { TeaMiddleware } from '../tea-utils/middleware.types';
import { Return } from '../tea-utils/return';

/**
 * La estructura que debe devolver cualquier función 'update'
 * Soporta tanto tupla [Model, Cmd] como el patrón Return de Elm
 */
export type UpdateResult<TModel, TMsg> = [TModel, Cmd] | Return<TModel, TMsg>;

/**
 * Configuración para crear un store Elm
 */
export interface ElmStoreConfig<TModel, TMsg> {
    /** Estado inicial o función que lo genera (permite params en init) */
    initial: TModel | ((params?: any) => UpdateResult<TModel, TMsg>);
    /** Función de actualización del modelo */
    update: (model: TModel, msg: TMsg) => UpdateResult<TModel, TMsg>;
    /** Función que retorna las suscripciones activas según el modelo */
    subscriptions?: (model: TModel) => SubDescriptor<TMsg>;
    /** Handlers locales para efectos */
    effectHandlers?: Record<string, EffectHandler<TMsg>>;
    /** Middlewares locales */
    middlewares?: TeaMiddleware<TModel, TMsg>[];
    /** Nombre identificador del store (para registry) */
    name?: string;
}

/**
 * Función handler para efectos secundarios
 */
export type EffectHandler<TMsg> = (
    payload: any,
    dispatch: (msg: TMsg) => void
) => Promise<any>;

/**
 * Estado del store creado por createElmStore
 */
export interface ElmStoreState<TModel, TMsg> {
    /** Estado actual del modelo */
    model: TModel;
    /** Función para enviar mensajes al store */
    dispatch: (msg: TMsg) => void;
    /** Inicializar el store con parámetros opcionales */
    init: (params?: any) => void;
    /** Limpiar recursos del store */
    cleanup: () => void;
}

/**
 * Resultado de la resolución de handlers
 */
export interface ResolvedHandlers<TMsg> {
    [key: string]: EffectHandler<TMsg> | undefined;
}

/**
 * Metadatos asociados a un mensaje
 */
export interface MessageMeta {
    /** ID único de traza para debugging */
    traceId: string;
    /** Timestamp de creación */
    timestamp: number;
    /** Metadatos adicionales */
    [key: string]: any;
}

/**
 * Tipos de suscripción soportados
 */
export type SubscriptionType =
    | 'NONE'
    | 'EVERY'
    | 'BATCH'
    | 'WATCH_STORE'
    | 'SSE'
    | 'EVENT'
    | 'CUSTOM'
    | 'RECEIVE_MSG';

/**
 * Configuración de protección contra message storms
 */
export interface StormProtectionConfig {
    maxMsgsPerSecond: number;
}

/**
 * Resultado del chequeo de storm
 */
export interface StormCheckResult {
    isStorming: boolean;
    msgCount: number;
    shouldThrottle: boolean;
}
