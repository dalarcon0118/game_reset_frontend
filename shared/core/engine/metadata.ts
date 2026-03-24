/**
 * Sistema de Metadatos y Trazabilidad para el Motor TEA.
 * Maneja la generación y gestión de metadatos asociados a mensajes.
 */

import { MessageMeta } from './types';
import { logger } from '../../utils/logger';

const log = logger.withTag('METADATA');

/**
 * Genera un ID único de traza para debugging
 */
export function generateTraceId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Sistema de metadatos para mensajes.
 * Usa WeakMap para no interferir con el garbage collection.
 */
export class MessageMetadata {
    private registry = new WeakMap<any, MessageMeta>();

    /**
     * Obtiene o crea metadatos para un mensaje
     */
    getOrCreate(msg: any): MessageMeta {
        if (!msg || typeof msg !== 'object') {
            return this.createBasicMeta();
        }

        let meta = this.registry.get(msg);
        if (!meta) {
            meta = this.createMeta();
            this.registry.set(msg, meta);
        }
        return meta;
    }

    /**
     * Crea metadatos básicos (para mensajes primitivos)
     */
    private createBasicMeta(): MessageMeta {
        return {
            traceId: generateTraceId(),
            timestamp: Date.now()
        };
    }

    /**
     * Crea nuevos metadatos con traceId y timestamp
     */
    private createMeta(): MessageMeta {
        return {
            traceId: generateTraceId(),
            timestamp: Date.now()
        };
    }

    /**
     * Asocia metadatos personalizados a un mensaje
     */
    setMeta(msg: any, meta: Partial<MessageMeta>): void {
        if (!msg || typeof msg !== 'object') return;

        const currentMeta = this.getOrCreate(msg);
        this.registry.set(msg, { ...currentMeta, ...meta });
    }

    /**
     * Copia metadatos de un mensaje padre a un mensaje hijo
     */
    inheritMeta(childMsg: any, parentMeta: MessageMeta): void {
        if (!childMsg || typeof childMsg !== 'object') return;

        this.registry.set(childMsg, { ...parentMeta });
    }

    /**
     * Obtiene metadatos existentes sin crear nuevos
     */
    getExisting(msg: any): MessageMeta | undefined {
        if (!msg || typeof msg !== 'object') return undefined;
        return this.registry.get(msg);
    }

    /**
     * Limpia metadatos de un mensaje específico
     */
    clearMeta(msg: any): void {
        if (!msg || typeof msg !== 'object') return;
        this.registry.delete(msg);
    }

    /**
     * Genera un traceId para inicialización
     */
    generateInitTraceId(): string {
        return 'INIT-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    }
}

/**
 * Crea una instancia de MessageMetadata
 */
export function createMessageMetadata(): MessageMetadata {
    return new MessageMetadata();
}
