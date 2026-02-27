import { OfflineFinancialStorage } from './storage.service';
import { BetApi } from '../bet/api';
import { CreateBetDTO } from '../bet/types';
import { transformBetToBackend, createValidBetPayload } from '../bet/mappers';
import { DrawApi } from '../draw/api';
import apiClient from '../api_client';
import {
    SyncQueueItem,
    DomainEntityConfig,
    SyncStrategy,
    SyncOutcome
} from './types';
import { logger } from '../../utils/logger';
import { match } from 'ts-pattern';
import { WorkerConfig, incrementConsecutiveErrors, resetConsecutiveErrors } from './worker.state';

const log = logger.withTag('SYNC_STRATEGY');

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Clasifica un error o respuesta para decidir la estrategia de reintento
 */
const classifySyncOutcome = (response: any, error?: any): SyncOutcome => {
    // 1. Caso de éxito claro
    if (response) {
        let responseId: string | number | undefined;
        if (Array.isArray(response) && response.length > 0) {
            responseId = response[0]?.id;
        } else if (response && typeof response === 'object' && !Array.isArray(response)) {
            responseId = (response as any).id;
        }

        if (responseId) {
            return { type: 'SUCCESS', backendId: responseId.toString() };
        }

        // CRITICAL FIX: Server returned 200 OK but we couldn't find an ID
        // This should be treated as an ERROR, not success, to prevent data loss
        log.error('Sync response received but NO ID found - This is a DATA LOSS risk!', {
            responseType: typeof response,
            isArray: Array.isArray(response),
            preview: JSON.stringify(response).substring(0, 1000)
        });

        // Return FATAL_ERROR instead of success to preserve the item in queue for manual review
        return {
            type: 'FATAL_ERROR',
            reason: 'Server returned successful response (200) but no ID was found in the response. Manual review required.'
        };
    }

    // 2. Clasificación de errores
    if (error) {
        const status = error.status || error.response?.status;

        // Errores de autenticación (401) -> RETRY_LATER (con warning)
        // No marcamos como FATAL porque es un estado transitorio que se resuelve con login
        if (status === 401) {
            log.warn('Authentication expired during sync. Marking for retry later.');
            return { type: 'RETRY_LATER', reason: 'Authentication expired' };
        }

        // Errores de código local (bug en frontend) -> FATAL
        if (error instanceof SyntaxError || error instanceof TypeError || error instanceof ReferenceError) {
            return { type: 'FATAL_ERROR', reason: `Code Error: ${error.name} - ${error.message}` };
        }

        // Errores de cliente (400-499) son FATALES (excepto 408 y 429)
        if (status && status >= 400 && status < 500 && status !== 429 && status !== 408) {
            // Extraer información detallada del backend para mejor diagnóstico
            const backendErrorDetail = error.data?.detail || error.data?.message || error.data?.error_type;
            const backendContext = error.data?.context || error.data;

            const reason = backendErrorDetail
                ? `Client Error ${status}: ${backendErrorDetail}`
                : error.message || `Client Error ${status}`;

            // Log detallado para diagnóstico
            log.error(`HTTP ${status} Error from backend`, {
                status,
                backendDetail: backendErrorDetail,
                backendContext: backendContext,
                errorMessage: error.message,
                errorData: error.data
            });

            return { type: 'FATAL_ERROR', reason: reason };
        }
        // Errores de servidor (500+), Red (sin status) o Rate Limit (429/408) son REINTENTABLES
        return { type: 'RETRY_LATER', reason: error.message || 'Network/Server Error' };
    }

    return { type: 'FATAL_ERROR', reason: 'Unknown state' };
};

// ============================================================================
// ESTRATEGIAS
// ============================================================================

/**
 * Estrategia para sincronizar apuestas (PUSH)
 */
export class BetPushStrategy implements SyncStrategy {
    async sync(config: DomainEntityConfig, item: SyncQueueItem, workerConfig: WorkerConfig): Promise<boolean> {
        if (!item) return false;

        const bets = await OfflineFinancialStorage.getPendingBetsV2();
        const bet = bets.find(b => b.offlineId === item.entityId);

        if (!bet || bet.status === 'synced') {
            if (!bet) {
                log.warn(`No pending bet found for ID ${item.entityId}`);
                await OfflineFinancialStorage.updateQueueItem(item.id, {
                    status: 'failed',
                    errorMessage: 'Bet not found in storage'
                });
            }
            return false;
        }

        // Marcar como procesando
        await OfflineFinancialStorage.updatePendingBetV2(bet.offlineId, { status: 'syncing' });
        await OfflineFinancialStorage.updateQueueItem(item.id, {
            status: 'processing',
            lastAttempt: Date.now(),
        });

        try {
            // 1. Extraer datos de la apuesta
            const {
                offlineId, status, financialImpact, retryCount, lastError, syncedAt,
                timestamp, backendId, ...restBetData
            } = bet;

            // 2. Preparar payload usando el mapper para asegurar formato correcto para Pydantic
            // Primero preparamos los datos básicos
            const rawBetData: CreateBetDTO = {
                ...restBetData,
                draw: typeof restBetData.draw === 'string' ? parseInt(restBetData.draw) : restBetData.draw,
                drawId: restBetData.drawId || restBetData.draw?.toString(),
                numbers_played: typeof restBetData.numbers_played === 'string'
                    ? JSON.parse(restBetData.numbers_played)
                    : restBetData.numbers_played,
            };

            // USAR EL MAPPER: Transformar al formato exacto que el backend (Pydantic) espera
            const betData = transformBetToBackend(rawBetData);

            // Llamar a la API
            let outcome: SyncOutcome;
            try {
                // Log detallado del payload para diagnóstico de errores HTTP 400
                log.info(`Sending bet payload for sync (ID: ${bet.offlineId})`, {
                    offlineId: bet.offlineId,
                    drawId: betData.drawId,
                    receiptCode: betData.receiptCode,
                    fijosCount: betData.fijosCorridos?.length,
                    parletsCount: betData.parlets?.length,
                    centenasCount: betData.centenas?.length,
                    loteriaCount: betData.loteria?.length,
                    fullPayload: JSON.stringify(betData, null, 2)
                });

                const response = await BetApi.createWithIdempotencyKey(betData as unknown as CreateBetDTO, bet.offlineId);

                // LOG: Diagnostic info
                log.info(`Sync API response for bet ${bet.offlineId}`, {
                    hasResponse: !!response,
                    isArray: Array.isArray(response),
                    length: Array.isArray(response) ? response.length : 'N/A'
                });

                outcome = classifySyncOutcome(response);
            } catch (error: any) {
                log.error(`Sync API call failed for bet ${bet.offlineId}`, error);
                outcome = classifySyncOutcome(null, error);
            }

            // Manejar resultado
            return await match(outcome)
                .with({ type: 'SUCCESS' }, async ({ backendId }) => {
                    await OfflineFinancialStorage.updatePendingBetV2(bet.offlineId, {
                        status: 'synced',
                        backendId: backendId,
                        syncedAt: Date.now(),
                    });
                    await OfflineFinancialStorage.updateQueueItem(item.id, { status: 'completed' });
                    resetConsecutiveErrors();
                    await OfflineFinancialStorage.recordSuccessfulSync();
                    return true;
                })
                .with({ type: 'FATAL_ERROR' }, async ({ reason }) => {
                    log.error(`Fatal sync error for bet ${bet.offlineId}: ${reason}`);
                    await OfflineFinancialStorage.updateQueueItem(item.id, {
                        status: 'failed',
                        attempts: (item.attempts || 0) + 1,
                        errorMessage: reason,
                    });
                    await OfflineFinancialStorage.updatePendingBetV2(bet.offlineId, {
                        status: 'error',
                        retryCount: (item.attempts || 0) + 1,
                        lastError: reason,
                    });
                    await OfflineFinancialStorage.recordSyncError(reason);
                    return false;
                })
                .with({ type: 'RETRY_LATER' }, async ({ reason }) => {
                    log.warn(`Temporary sync error for bet ${bet.offlineId}: ${reason}`);
                    incrementConsecutiveErrors();
                    const newAttemptCount = (item.attempts || 0) + 1;

                    if (newAttemptCount < workerConfig.maxRetries) {
                        await OfflineFinancialStorage.updateQueueItem(item.id, {
                            status: 'pending',
                            attempts: newAttemptCount,
                            errorMessage: reason,
                        });
                        await OfflineFinancialStorage.updatePendingBetV2(bet.offlineId, {
                            status: 'pending',
                            retryCount: newAttemptCount,
                            lastError: reason,
                        });
                    } else {
                        await OfflineFinancialStorage.updateQueueItem(item.id, {
                            status: 'failed',
                            attempts: newAttemptCount,
                            errorMessage: `Max retries reached: ${reason}`,
                        });
                        await OfflineFinancialStorage.updatePendingBetV2(bet.offlineId, {
                            status: 'error',
                            retryCount: newAttemptCount,
                            lastError: `Max retries reached: ${reason}`,
                        });
                    }
                    return false;
                })
                .exhaustive();

        } catch (error: any) {
            log.error(`Unexpected error in sync logic for ${bet.offlineId}`, error);
            await OfflineFinancialStorage.updateQueueItem(item.id, {
                status: 'failed',
                errorMessage: `Unexpected: ${error.message}`
            });
            return false;
        }
    }
}

/**
 * Estrategia para sincronizar sorteos (PULL)
 */
export class DrawsPullStrategy implements SyncStrategy {
    async sync(config: DomainEntityConfig): Promise<boolean> {
        try {
            // CASO ESPECIAL: DRAWS (Sorteos)
            // Usamos DrawApi.list para aprovechar su lógica de normalización
            const data = await DrawApi.list({ next24h: true });

            if (data && Array.isArray(data)) {
                await OfflineFinancialStorage.saveEntityData(config.name, data);
                log.info(`Synced ${data.length} items for entity ${config.name} to LocalStorage`);
                return true;
            }
            return false;
        } catch (error: any) {
            const status = error?.status || error?.response?.status;
            if (status === 401) {
                log.warn(`Authentication expired during sync for ${config.name}. Stopping sync.`);
                return false;
            }
            log.error(`Error syncing entity ${config.name}`, error);
            return false;
        }
    }
}

/**
 * Estrategia Genérica (PULL)
 */
export class GenericPullStrategy implements SyncStrategy {
    async sync(config: DomainEntityConfig): Promise<boolean> {
        if (!config.apiEndpoint) return false;

        try {
            const response = await apiClient.get<any>(config.apiEndpoint);
            // Normalización básica
            const data = Array.isArray(response)
                ? response
                : (Array.isArray(response?.results) ? response.results : (Array.isArray(response?.data) ? response.data : []));

            if (data && Array.isArray(data)) {
                await OfflineFinancialStorage.saveEntityData(config.name, data);
                log.info(`Synced ${data.length} items for entity ${config.name} to LocalStorage`);
                return true;
            }
            return false;
        } catch (error) {
            log.error(`Error syncing entity ${config.name}`, error);
            return false;
        }
    }
}

/**
 * Estrategia Genérica (PUSH)
 */
export class GenericPushStrategy implements SyncStrategy {
    async sync(config: DomainEntityConfig, item: SyncQueueItem, workerConfig: WorkerConfig): Promise<boolean> {
        if (!item || !config.apiEndpoint) return false;

        try {
            // Obtener datos de la entidad
            // Asumimos que item.entityId es el ID para buscar en el storage
            // PERO, getEntityData devuelve TODO el array o objeto.
            // Necesitamos saber CÓMO buscar el item específico.
            // Por ahora, asumimos que si es PUSH, el item.payload contiene los datos o
            // que getEntityData devuelve una lista y buscamos por ID.

            // Para ser robustos en generic push, necesitamos que:
            // 1. El item en cola tenga el payload (idealmente)
            // 2. O que sepamos buscarlo en la colección.

            // Vamos a intentar buscar en la colección si es un array
            const collection = await OfflineFinancialStorage.getEntityData<any[]>(config.name);
            let entityData = null;

            if (Array.isArray(collection)) {
                entityData = collection.find(e => e.id === item.entityId || e.offlineId === item.entityId);
            }

            if (!entityData) {
                log.warn(`Entity data not found for ${config.name} ID ${item.entityId}`);
                return false;
            }

            // Enviar al backend
            const response = await apiClient.post(config.apiEndpoint, entityData);
            const outcome = classifySyncOutcome(response);

            return await match(outcome)
                .with({ type: 'SUCCESS' }, async ({ backendId }) => {
                    // Actualizar ID backend si aplica
                    // Esto requeriría un método updateEntityData genérico que no tenemos aún expuesto fácilmente
                    // Por ahora, solo marcamos el item de la cola como completado
                    await OfflineFinancialStorage.updateQueueItem(item.id, { status: 'completed' });
                    resetConsecutiveErrors();
                    return true;
                })
                .with({ type: 'FATAL_ERROR' }, async ({ reason }) => {
                    await OfflineFinancialStorage.updateQueueItem(item.id, {
                        status: 'failed',
                        attempts: (item.attempts || 0) + 1,
                        errorMessage: reason,
                    });
                    return false;
                })
                .with({ type: 'RETRY_LATER' }, async ({ reason }) => {
                    incrementConsecutiveErrors();
                    const newAttemptCount = (item.attempts || 0) + 1;
                    if (newAttemptCount < workerConfig.maxRetries) {
                        await OfflineFinancialStorage.updateQueueItem(item.id, {
                            status: 'pending',
                            attempts: newAttemptCount,
                            errorMessage: reason,
                        });
                    } else {
                        await OfflineFinancialStorage.updateQueueItem(item.id, {
                            status: 'failed',
                            attempts: newAttemptCount,
                            errorMessage: `Max retries reached: ${reason}`,
                        });
                    }
                    return false;
                })
                .exhaustive();

        } catch (error: any) {
            log.error(`Error pushing entity ${config.name}`, error);
            return false;
        }
    }
}

/**
 * Estrategia Local Only (No-Op para sync)
 */
export class LocalOnlyStrategy implements SyncStrategy {
    async sync(config: DomainEntityConfig): Promise<boolean> {
        // No hace nada con el backend, pero podría usarse para limpieza o consolidación local
        return true;
    }
}

/**
 * Estrategia Genérica Bidireccional (SYNC)
 * Combina PUSH (si hay item) y PULL (si no hay item)
 */
export class GenericSyncStrategy implements SyncStrategy {
    private pushStrategy = new GenericPushStrategy();
    private pullStrategy = new GenericPullStrategy();

    async sync(config: DomainEntityConfig, item?: SyncQueueItem, workerConfig?: WorkerConfig): Promise<boolean> {
        if (item) {
            return this.pushStrategy.sync(config, item, workerConfig!);
        } else {
            return this.pullStrategy.sync(config);
        }
    }
}
