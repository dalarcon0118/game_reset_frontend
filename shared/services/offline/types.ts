/**
 * Tipos para el sistema Offline-First de estados financieros
 * 
 * Este archivo extiende la funcionalidad existente de PendingBet
 * manteniendo compatibilidad hacia atrás.
 */

import { PendingBet as LegacyPendingBet } from '../offline_storage';

// ============================================================================
// ENUMERACIONES
// ============================================================================

/**
 * Estados de sincronización de una apuesta
 */
export type SyncStatus =
    | 'pending'      // Pendiente de sincronizar
    | 'syncing'      // Sincronizando actualmente
    | 'synced'       // Sincronizado exitosamente
    | 'error';       // Error en sincronización

/**
 * Estados de un item en la cola de sincronización
 */
export type QueueItemStatus =
    | 'pending'      // En cola, esperando
    | 'processing'   // Procesando actualmente
    | 'completed'    // Completado exitosamente
    | 'failed';      // Falló después de reintentos

/**
 * Tipos de entidades que pueden sincronizarse
 */
export type SyncEntityType =
    | 'bet'              // Apuesta
    | 'financial_update' // Actualización financiera
    | 'bet_deletion';    // Eliminación de apuesta

/**
 * Estado del worker de sincronización
 */
export type WorkerStatus =
    | 'idle'       // Inactivo
    | 'running'    // Ejecutándose
    | 'paused'     // Pausado (sin conexión)
    | 'error';     // Error crítico

// ============================================================================
// INTERFACES PRINCIPALES
// ============================================================================

/**
 * Impacto financiero de una apuesta individual
 */
export interface FinancialImpact {
    /** Monto total recolectado (amount) */
    totalCollected: number;

    /** Comisión calculada para esta apuesta */
    commission: number;

    /** Monto neto después de comisión */
    netAmount: number;
}

/**
 * Apuesta pendiente extendida (V2)
 * Extiende PendingBet legacy manteniendo compatibilidad
 */
export type PendingBetV2 = Omit<LegacyPendingBet, 'status'> & {
    /** Impacto financiero calculado localmente */
    financialImpact?: FinancialImpact;

    /** Estado de sincronización */
    status?: SyncStatus;

    /** ID asignado por el backend después de sincronizar */
    backendId?: string;

    /** Número de intentos de sincronización */
    retryCount?: number;

    /** Último error de sincronización */
    lastError?: string;

    /** Timestamp de sincronización exitosa */
    syncedAt?: number;
};

/**
 * Resultado de una operación de sincronización
 */
export type SyncOutcome =
    | { type: 'SUCCESS'; backendId?: string }
    | { type: 'RETRY_LATER'; reason: string }    // Errores transitorios (Red, 500)
    | { type: 'FATAL_ERROR'; reason: string };   // Errores permanentes (400, Validación)

/**
 * Interfaz para estrategias de sincronización
 */
export interface SyncStrategy {
    sync(config: DomainEntityConfig, item?: SyncQueueItem, workerConfig?: any): Promise<boolean>;
}

export interface DrawFinancialState {
    /** Identificador del sorteo */
    drawId: string;

    /** Timestamp de última actualización */
    lastUpdated: number;

    /** Datos calculados localmente (apuestas pendientes) */
    local: {
        totalCollected: number;
        totalPaid: number;
        netResult: number;
        betCount: number;
    };

    /** Datos del servidor (último conocido) */
    server?: {
        totalCollected: number;
        totalPaid: number;
        netResult: number;
        betCount: number;
        lastSync: number;
    };

    /** Estado combinado (lo que se muestra en UI) */
    combined: {
        totalCollected: number;
        totalPaid: number;
        netResult: number;
        betCount: number;
        pendingSync: boolean;
    };
}

/**
 * Item en la cola de sincronización
 */
export interface SyncQueueItem {
    /** ID único del item en la cola */
    id: string;

    /** Tipo de entidad */
    type: SyncEntityType;

    /** ID de la entidad (localId para bets) */
    entityId: string;

    /** Prioridad (1 = alta, 5 = baja) */
    priority: number;

    /** Timestamp de creación */
    createdAt: number;

    /** Número de intentos realizados */
    attempts: number;

    /** Timestamp del último intento */
    lastAttempt?: number;

    /** Estado actual en la cola */
    status: QueueItemStatus;

    /** Mensaje de error (si aplica) */
    errorMessage?: string;
}

/**
 * Metadatos de sincronización
 */
export interface SyncMetadata {
    /** Última sincronización exitosa */
    lastSuccessfulSync?: number;

    /** Total de sincronizaciones exitosas */
    totalSyncs: number;

    /** Total de errores */
    totalErrors: number;

    /** Estado actual del worker */
    workerStatus: WorkerStatus;

    /** Timestamp de inicio del worker */
    workerStartedAt?: number;

    /** Último error del worker */
    lastWorkerError?: string;
}

// ============================================================================
// TIPOS PARA API Y EVENTOS
// ============================================================================

/**
 * Resultado de una operación de sincronización
 */
export interface SyncResult {
    /** Éxito general de la operación */
    success: boolean;

    /** Items procesados */
    processed: number;

    /** Items exitosos */
    succeeded: number;

    /** Items fallidos */
    failed: number;

    /** Errores detallados */
    errors?: {
        itemId: string;
        error: string;
    }[];
}

/**
 * Estadísticas de sincronización
 */
export interface SyncStats {
    /** Apuestas pendientes */
    pendingBets: number;

    /** Apuestas en proceso de sync */
    syncingBets: number;

    /** Apuestas con error */
    errorBets: number;

    /** Apuestas sincronizadas hoy */
    syncedToday: number;

    /** Items en cola */
    queueLength: number;

    /** Estado del worker */
    workerStatus: WorkerStatus;

    /** Tiempo desde último sync exitoso */
    timeSinceLastSync?: number;
}

/**
 * Evento de cambio en estado financiero
 */
export interface FinancialStateChangeEvent {
    /** ID del sorteo afectado */
    drawId: string;

    /** Nuevo estado financiero */
    state: DrawFinancialState;

    /** Tipo de cambio */
    changeType: 'local_added' | 'server_updated' | 'combined_recalculated';

    /** Timestamp del evento */
    timestamp: number;
}

/**
 * Callback para suscripción a cambios
 */
export type FinancialStateChangeCallback = (event: FinancialStateChangeEvent) => void;

/**
 * Función para cancelar suscripción
 */
export type Unsubscribe = () => void;

// ============================================================================
// TIPOS DE SERVIDOR (RESPUESTAS API)
// ============================================================================

/**
 * Estado financiero desde el servidor
 */
export interface ServerFinancialState {
    totalCollected: number;
    totalPaid: number;
    netResult: number;
    betCount: number;
    lastSync: number;
}

/**
 * Respuesta de creación de apuesta en backend
 */
export interface CreateBetResponse {
    id: string;
    draw: string | number;
    amount: number;
    numbers_played: any;
    created_at: string;
    receipt_code?: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

export const OFFLINE_STORAGE_KEYS = {
    PENDING_BETS_V2: '@pending_bets_v2',
    DRAW_FINANCIAL_STATES: '@draw_financial_states',
    SYNC_QUEUE: '@sync_queue',
    SYNC_METADATA: '@sync_metadata',
    DRAWS: '@draws', // Nueva base de datos de sorteos principal
    SUMMARY: '@summary', // Nueva base de datos de resumen principal
} as const;

export const SYNC_CONSTANTS = {
    /** Intervalo default de sincronización (ms) */
    DEFAULT_SYNC_INTERVAL: 5000,

    /** Máximo número de reintentos */
    MAX_RETRIES: 5,

    /** Backoff base para reintentos (ms) */
    RETRY_BACKOFF_BASE: 1000,

    /** Límite de apuestas offline */
    MAX_OFFLINE_BETS: 500,

    /** Días para limpiar apuestas sync */
    DAYS_TO_CLEANUP: 7,
} as const;

// ============================================================================
// INFRAESTRUCTURA ADAPTABLE (DOMAIN-AGNOSTIC)
// ============================================================================

/**
 * Estrategias de sincronización para entidades de dominio
 */
export type SyncMethod =
    | 'PULL'          // El backend es la fuente, el frontend descarga periódicamente
    | 'PUSH'          // El frontend genera datos que deben enviarse al backend
    | 'SYNC'          // Bidireccional (combinación de Pull y Push)
    | 'LOCAL_ONLY';   // Persistencia local pura, sin intervención del backend

/**
 * Definición de una entidad de dominio en la infraestructura adaptable
 */
export interface DomainEntityConfig<T = any> {
    /** Nombre único de la entidad de dominio (ej: 'Draws', 'Rules', 'Summary') */
    name: string;
    /** Clave de LocalStorage asociada */
    storageKey: string;
    /** Estrategia de sincronización a seguir */
    syncStrategy: SyncMethod;
    /** Endpoint base de la API para esta entidad */
    apiEndpoint?: string;
    /** Función opcional para limpiar o transformar datos antes de persistir */
    transform?: (data: any) => T;
    /** Frecuencia de sincronización deseada en ms (opcional) */
    syncFrequency?: number;
    /** Prioridad de sincronización (1 = más alta) */
    priority?: number;
}

/**
 * Registro central de entidades de dominio
 * Permite que el sistema crezca añadiendo nuevos conceptos aquí
 */
export const DOMAIN_ENTITY_REGISTRY: Record<string, DomainEntityConfig> = {
    DRAWS: {
        name: 'DRAWS',
        storageKey: '@draws',
        syncStrategy: 'PULL',
        apiEndpoint: '/draw/draws/', // Se asume base URL en el API client
        priority: 1,
    },
    BETS: {
        name: 'BETS',
        storageKey: '@pending_bets_v2',
        syncStrategy: 'PUSH',
        apiEndpoint: '/draw/bets/',
        priority: 2,
    },
    SUMMARY: {
        name: 'SUMMARY',
        storageKey: '@summary',
        syncStrategy: 'LOCAL_ONLY',
        priority: 3,
    },
    RULES: {
        name: 'RULES',
        storageKey: '@rules',
        syncStrategy: 'PULL',
        apiEndpoint: '/draw/validation-rules/for-current-user/',
        priority: 4,
    }
};

/**
 * Eventos genéricos de dominio
 */
export type DomainEventType =
    | 'ENTITY_CHANGED'
    | 'SYNC_STARTED'
    | 'SYNC_COMPLETED'
    | 'SYNC_ERROR'
    | 'MAINTENANCE_COMPLETED';

export interface DomainEvent<T = any> {
    type: DomainEventType;
    entity: string;
    payload?: T;
    timestamp: number;
}

export type DomainEventCallback = (event: DomainEvent) => void;

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Verifica si un PendingBet es V2 (tiene los campos nuevos)
 */
export function isPendingBetV2(bet: LegacyPendingBet | PendingBetV2): bet is PendingBetV2 {
    return 'status' in bet || 'financialImpact' in bet;
}

/**
 * Verifica si hay cambios pendientes de sincronizar
 */
export function hasPendingChanges(state: DrawFinancialState): boolean {
    return state.combined.pendingSync;
}
