/**
 * Módulo Offline-First para Estados Financieros
 * 
 * Este módulo proporciona funcionalidad offline-first para
 * estados financieros de sorteos y sincronización asíncrona.
 * 
 * @example
 * ```typescript
 * import { OfflineFinancialService } from '@/shared/services/offline';
 * 
 * // Inicializar
 * await OfflineFinancialService.initialize();
 * 
 * // Crear apuesta offline
 * const pendingBet = await OfflineFinancialService.placeBet({
 *   drawId: '123',
 *   numbers: ['12', '34', '56'],
 *   amount: 100,
 *   betType: 'direct',
 *   structureId: '456'
 * });
 * 
 * // Obtener estado financiero
 * const state = await OfflineFinancialService.getDrawState('123');
 * 
 * // Suscribirse a cambios
 * const unsubscribe = OfflineFinancialService.onStateChange('123', (event) => {
 *   // Estado actualizado disponible en event.state
 * });
 * ```
 */

// Exportar tipos
// Importar dependencias para el servicio principal
import { OfflineFinancialStorage } from './storage.service';
import {
    startSyncWorker,
    stopSyncWorker,
    pauseSyncWorker,
    resumeSyncWorker,
    forceSyncNow,
    getWorkerStats,
    isWorkerRunning,
    cleanupWorker,
    onSyncEvent,
} from './sync.worker';
import type {
    PendingBetV2,
    DrawFinancialState,
    SyncQueueItem,
    SyncResult,
    SyncStats,
    SyncStatus,
    FinancialStateChangeEvent,
    FinancialStateChangeCallback,
    Unsubscribe,
    FinancialImpact,
} from './types';
import { CreateBetDTO } from '../bet/types';
import { SYNC_CONSTANTS } from './types';
import { logger } from '../../utils/logger';

const log = logger.withTag('OFFLINE_FINANCIAL_SERVICE');

export * from './types';

// Exportar servicios
export { OfflineFinancialStorage } from './storage.service';
export * from './sync.worker';

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Genera un UUID v4 simple sin dependencias externas
 */
function uuidv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ============================================================================
// EVENT EMITTER PARA CAMBIOS DE ESTADO
// ============================================================================

type EventHandler = (event: FinancialStateChangeEvent) => void;

class StateChangeEmitter {
    private handlers: Map<string, Set<EventHandler>> = new Map();
    private globalHandlers: Set<EventHandler> = new Set();

    subscribe(drawId: string, handler: EventHandler): Unsubscribe {
        if (!this.handlers.has(drawId)) {
            this.handlers.set(drawId, new Set());
        }
        this.handlers.get(drawId)!.add(handler);

        return () => {
            this.handlers.get(drawId)?.delete(handler);
        };
    }

    subscribeAll(handler: EventHandler): Unsubscribe {
        this.globalHandlers.add(handler);
        return () => {
            this.globalHandlers.delete(handler);
        };
    }

    emit(event: FinancialStateChangeEvent): void {
        // Emitir a handlers específicos del draw
        this.handlers.get(event.drawId)?.forEach(handler => {
            try {
                handler(event);
            } catch (error) {
                log.error('Error in state change handler', error);
            }
        });

        // Emitir a handlers globales
        this.globalHandlers.forEach(handler => {
            try {
                handler(event);
            } catch (error) {
                log.error('Error in global state change handler', error);
            }
        });
    }
}

const stateEmitter = new StateChangeEmitter();

// ============================================================================
// CALCULADOR FINANCIERO
// ============================================================================

/**
 * Calcula el impacto financiero de una apuesta
 */
function calculateFinancialImpact(
    amount: number,
    commissionRate: number = 0.1
): FinancialImpact {
    const commission = amount * commissionRate;
    return {
        totalCollected: amount,
        commission,
        netAmount: amount - commission,
    };
}

/**
 * Calcula el estado financiero de un sorteo
 */
async function calculateDrawState(
    drawId: string,
    serverState?: DrawFinancialState['server']
): Promise<DrawFinancialState> {
    const pendingBets = await OfflineFinancialStorage.getPendingBetsByDrawV2(drawId);
    const now = Date.now();

    // Calcular totales locales
    const local = pendingBets
        .filter(bet => bet.status !== 'synced' && bet.financialImpact)
        .reduce(
            (acc, bet) => ({
                totalCollected: acc.totalCollected + (bet.financialImpact?.totalCollected || 0),
                totalPaid: acc.totalPaid,
                netResult: acc.netResult + (bet.financialImpact?.netAmount || 0),
                betCount: acc.betCount + 1,
            }),
            { totalCollected: 0, totalPaid: 0, netResult: 0, betCount: 0 }
        );

    // Determinar si hay cambios pendientes
    const pendingSync = pendingBets.some(bet => bet.status === 'pending' || bet.status === 'error');

    // Calcular estado combinado
    const combined = {
        totalCollected: local.totalCollected + (serverState?.totalCollected || 0),
        totalPaid: serverState?.totalPaid || 0,
        netResult: local.netResult + (serverState?.netResult || 0),
        betCount: local.betCount + (serverState?.betCount || 0),
        pendingSync,
    };

    return {
        drawId,
        lastUpdated: now,
        local,
        server: serverState,
        combined,
    };
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

/**
 * Servicio principal para operaciones offline-first
 */
export class OfflineFinancialService {
    private static initPromise: Promise<void> | null = null;

    /**
     * Inicializa el sistema offline
     */
    static async initialize(): Promise<void> {
        if (!this.initPromise) {
            this.initPromise = (async () => {
                await OfflineFinancialStorage.initialize();
                log.info('Initialized');
            })();
        }
        return this.initPromise;
    }

    /**
     * Asegura que el sistema esté inicializado antes de operar
     */
    private static async ensureInitialized(): Promise<void> {
        if (!this.initPromise) {
            await this.initialize();
        } else {
            await this.initPromise;
        }
    }

    /**
     * Crea una nueva apuesta offline
     */
    static async placeBet(betData: CreateBetDTO & { commissionRate?: number }): Promise<PendingBetV2> {
        await this.ensureInitialized();
        const localId = uuidv4();
        const now = Date.now();
        const commissionRate = betData.commissionRate || 0.1;
        const drawIdStr = (betData.drawId || betData.draw || '').toString();

        // Calcular impacto financiero
        const financialImpact = calculateFinancialImpact(betData.amount || 0, commissionRate);

        // Crear apuesta pendiente (V2)
        // Aseguramos que incluimos todos los campos de CreateBetDTO
        const pendingBet: PendingBetV2 = {
            ...betData,
            offlineId: localId,
            drawId: drawIdStr,
            timestamp: now,
            status: 'pending' as SyncStatus,
            retryCount: 0,
            financialImpact,
        };

        // Forzar que draw sea el correcto si venía como string
        if (typeof betData.draw !== 'number' && betData.draw !== undefined) {
            (pendingBet as any).draw = undefined;
        }

        // Guardar apuesta
        await OfflineFinancialStorage.savePendingBetV2(pendingBet);

        // Agregar a cola de sincronización
        await OfflineFinancialStorage.addToQueue({
            type: 'bet',
            entityId: localId,
            priority: 1,
            status: 'pending',
            attempts: 0,
        });

        // Recalcular estado financiero
        const drawState = await calculateDrawState(drawIdStr);
        if (drawState) {
            await OfflineFinancialStorage.saveDrawState(drawState);

            // Emitir evento
            stateEmitter.emit({
                drawId: drawIdStr,
                state: drawState,
                changeType: 'local_added',
                timestamp: now,
            });
        }

        return pendingBet;
    }

    /**
     * Obtiene los sorteos del LocalStorage (Single Source of Truth)
     */
    static async getDraws(): Promise<any[]> {
        await this.ensureInitialized();
        const draws = await OfflineFinancialStorage.getDraws();
        return draws || [];
    }

    /**
     * Fuerza una sincronización de sorteos desde el backend
     */
    static async refreshDraws(): Promise<any[]> {
        await this.ensureInitialized();
        // Intentar sync forzado si hay internet
        await forceSyncNow(); // Esto disparará el ciclo que incluye syncDraws
        return this.getDraws();
    }

    /**
     * Obtiene el estado financiero de un sorteo
     */
    static async getDrawState(drawId: string): Promise<DrawFinancialState | null> {
        await this.ensureInitialized();
        // Intentar obtener estado guardado
        let state = await OfflineFinancialStorage.getDrawState(drawId);

        if (!state) {
            // Calcular nuevo estado
            state = await calculateDrawState(drawId);
            await OfflineFinancialStorage.saveDrawState(state);
        }

        return state;
    }

    /**
     * Obtiene todas las apuestas pendientes
     */
    static async getPendingBets(): Promise<PendingBetV2[]> {
        await this.ensureInitialized();
        return OfflineFinancialStorage.getPendingBetsV2();
    }

    /**
     * Obtiene apuestas pendientes por sorteo
     */
    static async getPendingBetsByDraw(drawId: string): Promise<PendingBetV2[]> {
        await this.ensureInitialized();
        return OfflineFinancialStorage.getPendingBetsByDrawV2(drawId);
    }

    /**
     * Suscribe a cambios en el estado financiero de un sorteo
     */
    static onStateChange(drawId: string, callback: FinancialStateChangeCallback): Unsubscribe {
        return stateEmitter.subscribe(drawId, callback);
    }

    /**
     * Suscribe a cambios en cualquier estado financiero
     */
    static onAnyStateChange(callback: FinancialStateChangeCallback): Unsubscribe {
        return stateEmitter.subscribeAll(callback);
    }

    /**
     * Obtiene estadísticas de sincronización
     */
    static async getSyncStats(): Promise<SyncStats> {
        await this.ensureInitialized();
        const [pendingBets, queue, metadata] = await Promise.all([
            OfflineFinancialStorage.getPendingBetsV2(),
            OfflineFinancialStorage.getSyncQueue(),
            OfflineFinancialStorage.getSyncMetadata(),
        ]);

        const now = Date.now();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return {
            pendingBets: pendingBets.filter(b => b.status === 'pending').length,
            syncingBets: pendingBets.filter(b => b.status === 'syncing').length,
            errorBets: pendingBets.filter(b => b.status === 'error').length,
            syncedToday: pendingBets.filter(b =>
                b.status === 'synced' &&
                b.syncedAt &&
                b.syncedAt >= today.getTime()
            ).length,
            queueLength: queue.filter(item => item.status === 'pending').length,
            workerStatus: metadata.workerStatus,
            timeSinceLastSync: metadata.lastSuccessfulSync
                ? now - metadata.lastSuccessfulSync
                : undefined,
        };
    }

    /**
     * Verifica si hay cambios pendientes de sincronizar
     */
    static async hasPendingChanges(): Promise<boolean> {
        await this.ensureInitialized();
        const pendingBets = await OfflineFinancialStorage.getPendingBetsByStatusV2('pending');
        return pendingBets.length > 0;
    }

    /**
     * Inicia el worker de sincronización en segundo plano
     */
    static async startSyncWorker(config?: { syncInterval?: number }): Promise<void> {
        await this.ensureInitialized();
        await startSyncWorker(config);
    }

    /**
     * Detiene el worker de sincronización
     */
    static async stopSyncWorker(): Promise<void> {
        await this.ensureInitialized();
        await stopSyncWorker();
    }

    /**
     * Pausa temporalmente el worker
     */
    static async pauseSyncWorker(): Promise<void> {
        await this.ensureInitialized();
        await pauseSyncWorker();
    }

    /**
     * Reanuda el worker pausado
     */
    static async resumeSyncWorker(): Promise<void> {
        await this.ensureInitialized();
        await resumeSyncWorker();
    }

    /**
     * Fuerza una sincronización manual inmediata
     */
    static async syncNow(): Promise<SyncResult> {
        await this.ensureInitialized();
        return forceSyncNow();
    }

    /**
     * Verifica si el worker está corriendo
     */
    static isSyncWorkerRunning(): boolean {
        return isWorkerRunning();
    }

    /**
     * Obtiene estadísticas del worker
     */
    static getWorkerStats() {
        return getWorkerStats();
    }

    /**
     * Suscribe a eventos de sincronización
     */
    static onSyncEvent(callback: Parameters<typeof onSyncEvent>[0]): Unsubscribe {
        return onSyncEvent(callback);
    }

    /**
     * Actualiza el estado del servidor para un sorteo
     * Llamado cuando se reciben datos actualizados del backend
     */
    static async updateServerState(
        drawId: string,
        serverState: DrawFinancialState['server']
    ): Promise<void> {
        if (!serverState) return;

        await this.ensureInitialized();

        // Calcular nuevo estado combinado
        const drawState = await calculateDrawState(drawId, serverState);
        await OfflineFinancialStorage.saveDrawState(drawState);

        // Emitir evento
        stateEmitter.emit({
            drawId,
            state: drawState,
            changeType: 'server_updated',
            timestamp: Date.now(),
        });
    }

    /**
     * Ejecuta mantenimiento de limpieza
     */
    static async runMaintenance(): Promise<{
        betsCleaned: number;
        queueCleaned: number;
        statesCleaned: number;
    }> {
        await this.ensureInitialized();
        return OfflineFinancialStorage.runMaintenance();
    }
}
