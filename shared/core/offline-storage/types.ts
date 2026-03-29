// Tipos para el nuevo sistema de almacenamiento offline

export type OfflineStorageVersion = 'v1' | 'v2';

export type StorageNamespace = string;

export type StorageKey = string;

// --- Puertos (Interfaces de Inyección) ---

/**
 * Puerto para el almacenamiento físico (AsyncStorage, localStorage, etc)
 */
export interface StoragePort {
  get<T>(key: string): Promise<T | null>;
  getMulti?<T>(keys: string[]): Promise<(T | null)[]>;
  set(key: string, value: any): Promise<void>;
  setMulti(entries: [string, any][]): Promise<void>;
  remove(key: string): Promise<void>;
  removeMulti(keys: string[]): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
  iterateKeys?(pattern?: string): AsyncGenerator<StorageKey, void, unknown>;
  clear(): Promise<void>;
}

/**
 * Puerto para obtener el tiempo actual
 */
export interface ClockPort {
  now(): number;
  iso(): string;
}

/**
 * Puerto para el bus de eventos
 */
export interface EventBusPort {
  publish<T>(event: DomainEvent<T>): void;
  subscribe(callback: DomainEventCallback): Unsubscribe;
  /**
   * Limpia todos los suscriptores (solo para testing)
   */
  clearSubscribers?(): void;
}

// --- Motor Core ---

export interface StorageMetadata {
  version: OfflineStorageVersion;
  timestamp: number;
  checksum?: string;
  expiresAt?: number;
}

export interface StorageEnvelope<T> {
  data: T;
  metadata: StorageMetadata;
}

export interface QueryResult<T> {
  all(): Promise<T[]>;
  count(): Promise<number>;
  first(): Promise<T | null>;
  keys(): Promise<string[]>;
}

// --- Eventos de Dominio ---

export type DomainEventType =
  | 'ENTITY_CHANGED'
  | 'ENTITY_REMOVED'
  | 'SYNC_STARTED'
  | 'SYNC_COMPLETED'
  | 'SYNC_ITEM_SUCCESS'
  | 'SYNC_ITEM_ERROR'
  | 'SYNC_ERROR'
  | 'MAINTENANCE_COMPLETED'
  | 'BETS_BLOCKED';

export interface DomainEvent<T = any> {
  type: DomainEventType;
  entity: string;
  payload?: T;
  timestamp: number;
}

export type DomainEventCallback = (event: DomainEvent) => void;
export type Unsubscribe = () => void;

// --- Sistema de Sincronización ---

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'blocked' | 'error';
export type QueueItemStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type SyncEntityType = 'bet' | 'financial_update' | 'bet_deletion' | 'dlq';
export type WorkerStatus = 'idle' | 'running' | 'paused' | 'error' | 'stopping' | 'stopped';

export interface SyncQueueItem {
  id: string;
  type: SyncEntityType;
  entityId: string;
  priority: number;
  createdAt: number;
  attempts: number;
  lastAttempt?: number;
  status: QueueItemStatus;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface SyncMetadata {
  lastSyncAt?: number;
  totalSyncs: number;
  totalErrors: number;
  workerStatus: WorkerStatus;
}

export interface WorkerConfig {
  /** Intervalo base de sincronización en ms */
  syncInterval: number;
  /** Máximo número de reintentos */
  maxRetries: number;
  /** Backoff base para reintentos en ms */
  retryBackoffBase: number;
  /** Batch size para sincronización */
  batchSize: number;
}

export interface WorkerStats {
  totalProcessed: number;
  totalSucceeded: number;
  totalFailed: number;
  lastRunAt: number | null;
}

export interface SyncOutcome {
  type: 'SUCCESS' | 'RETRY_LATER' | 'FATAL_ERROR';
  backendId?: string;
  reason?: string;
}

/**
 * Reporte detallado de una sesión de sincronización manual.
 */
export interface SyncReport {
  timestamp: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'OFFLINE' | 'NO_ITEMS';
  processed: number;
  succeeded: number;
  failed: number;
  errors: { entityId: string; type: string; reason: string }[];
  duration: number;
}

/**
 * Interfaz para estrategias de sincronización
 */
export interface SyncStrategy {
  push?(item: SyncQueueItem): Promise<SyncOutcome>;
  pushBatch?(items: SyncQueueItem[]): Promise<SyncOutcome[]>;
  pull?(): Promise<void>;
}

// Constantes globales
export const SYNC_CONSTANTS = {
  MAX_RETRIES: 5,
  MAX_OFFLINE_BETS: 500,
  DEFAULT_INTERVAL: 30000,
  BATCH_SIZE: 10,
  BLOCK_AFTER_HOURS: 24, // Bloquear después de 24h sin sincronizar
  RESET_HOUR: 0,         // Reset nocturno a medianoche
};

/**
 * Constantes de TTL (Time To Live) para el cache offline
 * Define cuánto tiempo persistirán los datos en el almacenamiento local
 */
export const STORAGE_TTL = {
  /** Sorteos (Draws): 4 horas - suficiente para el día actual */
  DRAW: 8 * 60 * 60 * 1000,

  /** Tipos de apuesta (Bet Types): 24 horas */
  BET_TYPE: 24 * 60 * 60 * 1000,

  /** Resumen financiero: 30 minutos */
  SUMMARY: 30 * 60 * 1000,

  /** Configuración del sistema: 1 hora */
  CONFIG: 60 * 60 * 1000,

  /** Metadatos de tiempo: 5 minutos */
  TIME_METADATA: 5 * 60 * 1000,

  /** Perfil de usuario: 24 horas */
  USER_PROFILE: 24 * 60 * 60 * 1000,

  /**
   * Apuestas (Bets): Sin TTL por defecto
   * Las apuestas pendientes persisten hasta sincronización manual
   * o hasta el cleanup diario
   */
  BET: undefined as undefined,
};

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

// Tipos para el sistema de migración
export interface MigrationResult {
  success: boolean;
  migratedKeys: number;
  failedKeys: number;
  errors: { key: string; error: string }[];
  metadata: {
    startTime: string;
    endTime: string;
    duration: number;
  };
}

export interface OldStorageData {
  [key: string]: any;
}
