/**
 * Sistema de Protección contra Message Storms.
 * Previene bucles infinitos detectando excesiva actividad de mensajes.
 */

import { logger } from '../../utils/logger';

const log = logger.withTag('STORM_PROTECTION');

/**
 * Configuración por defecto para protección contra storms
 */
const DEFAULT_MAX_MSGS_PER_SECOND = 50;
const DEFAULT_TIME_WINDOW_MS = 1000;

/**
 * Resultado del chequeo de storm
 */
export interface StormCheckResult {
    /** Si hay un storm activo */
    isStorming: boolean;
    /** Cantidad de mensajes en la ventana actual */
    msgCount: number;
    /** Si debe limitar el procesamiento */
    shouldThrottle: boolean;
}

/**
 * Protege contra message storms (alta frecuencia de mensajes).
 * Detecta bucles infinitos potenciales.
 */
export class StormProtection {
    private msgCount = 0;
    private lastMsgTime = Date.now();
    private isStorming = false;

    constructor(
        private maxMsgsPerSecond: number = DEFAULT_MAX_MSGS_PER_SECOND,
        private timeWindowMs: number = DEFAULT_TIME_WINDOW_MS
    ) { }

    /**
     * Verifica si el mensaje debe ser procesado o limitado
     */
    check(msgType: string): StormCheckResult {
        const now = Date.now();

        // Resetear contador si pasó la ventana de tiempo
        if (now - this.lastMsgTime >= this.timeWindowMs) {
            this.msgCount = 1;
            this.lastMsgTime = now;
            this.isStorming = false;
        } else {
            this.msgCount++;
        }

        // Detectar storm
        const shouldThrottle = this.msgCount > this.maxMsgsPerSecond && !this.isStorming;

        if (shouldThrottle) {
            this.isStorming = true;
            log.error(
                `Message Storm Detected! More than ${this.maxMsgsPerSecond} messages in 1s. ` +
                `Possible infinite loop with: ${msgType}. Throttling engine.`,
                'ENGINE_STORM_PROTECTION'
            );
        }

        return {
            isStorming: this.isStorming,
            msgCount: this.msgCount,
            shouldThrottle
        };
    }

    /**
     * Resetea el estado de protección
     */
    reset(): void {
        this.msgCount = 0;
        this.lastMsgTime = Date.now();
        this.isStorming = false;
    }

    /**
     * Obtiene el estado actual
     */
    getState(): { msgCount: number; isStorming: boolean } {
        return {
            msgCount: this.msgCount,
            isStorming: this.isStorming
        };
    }

    /**
     * Actualiza el límite de mensajes por segundo
     */
    setMaxMsgsPerSecond(max: number): void {
        this.maxMsgsPerSecond = max;
    }

    /**
     * Verifica si actualmente está en modo storm
     */
    isCurrentlyStorming(): boolean {
        return this.isStorming;
    }
}

/**
 * Factory para crear StormProtection
 */
export function createStormProtection(
    maxMsgsPerSecond: number = DEFAULT_MAX_MSGS_PER_SECOND
): StormProtection {
    return new StormProtection(maxMsgsPerSecond);
}
