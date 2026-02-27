
/**
 * Resultado de entrega a un suscriptor específico
 */
export interface SubscriberResult {
    readonly subscriberId: string;  // feature.id que recibió el mensaje
    readonly success: boolean;
    readonly error?: string;         // mensaje de error si falló
}

/**
 * Metadatos de cada mensaje enviado por el Kernel
 * Permite auditoría y debugging
 */
export interface MessageMetadata {
    readonly id: string;              // identificador único del mensaje (uuid)
    readonly channel: string;        // canal al que se envió
    readonly originFeature: string;   // feature que envió el mensaje
    readonly timestamp: number;       // timestamp Unix
    readonly payload: any;            // payload del mensaje
    readonly subscriberResults: SubscriberResult[];  // resultados por suscriptor
}

/**
 * Callback opcional cuando sendToChannel completa
 * Permite logging y detección de errores
 */
export interface DeliveryResult {
    readonly messageId: string;
    readonly channel: string;
    readonly deliveredTo: string[];   // subscriberIds exitosos
    readonly failedTo: string[];       // subscriberIds que fallaron
}

/**
 * Tipo para callback opcional
 */
export type OnDeliveryResult = (result: DeliveryResult) => void;
