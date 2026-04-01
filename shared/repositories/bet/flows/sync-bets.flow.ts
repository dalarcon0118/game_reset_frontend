import { Result } from '@/shared/core';
import { IBetStorage, IBetApi } from '../bet.types';
import { drawRepository } from '../../draw';
import { GameType } from '@/types';
import { mapBackendBetToFrontend } from '../bet.mapper.backend';
import { logger } from '@/shared/utils/logger';
import { dlqRepository } from '../../dlq';

const log = logger.withTag('SyncBetsFlow');

/**
 * Step function to sync a single bet.
 * Uses a pipeline internally for consistency.
 */
const syncSingleBet = async (
    bet: any,
    storage: IBetStorage,
    api: IBetApi
): Promise<Result<Error, void>> => {
    const amount = Number(bet.amount) || 0;
    const structureId = bet.ownerStructure;
    if (amount <= 0 || !structureId) {
        log.error(`[SYNC-BET-FLOW] 1. Datos inválidos para apuesta ${bet.externalId}`, { amount, structureId });
        return Result.error(new Error(`ERROR_CRITICO_SYNC: Datos inválidos en apuesta ${bet.externalId}`));
    }

    try {
        log.info(`[SYNC-BET-FLOW] 2. Iniciando sincronización de apuesta: ${bet.externalId}`);
        const response = await api.create(bet as any, bet.externalId);
        const backendBets = Array.isArray(response) ? response : [response];

        const betTypesResult = await drawRepository.getBetTypes(String(bet.drawId || '')) as any;
        const betTypes: GameType[] = betTypesResult.isOk()
            ? (betTypesResult.value as any[]).map((t: any): GameType => ({
                id: String(t.id),
                name: t.name,
                code: t.code || '',
                description: t.description || ''
            }))
            : [];

        const mappedBets = backendBets.map(b => mapBackendBetToFrontend(b, betTypes));
        log.info(`[SYNC-BET-FLOW] 3. Sincronización exitosa para apuesta: ${bet.externalId}. Actualizando estado...`);
        await storage.updateStatus(bet.externalId, 'synced', { backendBets: mappedBets });
        return Result.ok(undefined);
    } catch (error) {
        log.error(`[SYNC-BET-FLOW] 4. FALLO en sincronización de apuesta: ${bet.externalId}`, error);

        const attemptsCount = (bet.syncContext?.attemptsCount || 0) + 1;
        const status = (error as any)?.status ?? (error as any)?.response?.status;
        const isFatal = status >= 400 && status < 500 && status !== 401 && status !== 403;
        const lastError = (error as any)?.message
            || (error as any)?.data?.detail
            || (error as any)?.data?.message
            || String(error);

        const errorType = isFatal ? 'FATAL' : 'RETRYABLE';

        log.info(`[SYNC-BET-FLOW] 5. Clasificación de error: ${errorType} (Status: ${status}). Marcando apuesta como ${isFatal ? 'blocked' : 'pending'}`);

        await storage.updateStatus(bet.externalId, isFatal ? 'blocked' : 'pending', {
            syncContext: {
                lastAttempt: Date.now(),
                attemptsCount,
                lastError,
                errorType
            },
            lastError
        });

        // Si es un error fatal, agregamos a la DLQ local y reportamos al backend
        // Fire-and-forget: no bloqueamos el flujo local por la sincronización
        if (isFatal) {
            log.info(`[SYNC-BET-FLOW] 6. ERROR FATAL detectado. Agregando apuesta ${bet.externalId} a DLQ local...`);
            dlqRepository.add('bet', bet.externalId, bet, {
                message: lastError,
                code: String(status),
                status,
                timestamp: Date.now()
            }).then(() => {
                log.info(`[SYNC-BET-FLOW] 7. Apuesta ${bet.externalId} agregada exitosamente a DLQ local.`);
            }).catch(dlqErr => {
                log.error(`[SYNC-BET-FLOW] ERROR: No se pudo agregar apuesta ${bet.externalId} a DLQ local`, dlqErr);
            });

            log.info(`[SYNC-BET-FLOW] 8. Reportando error fatal al backend para apuesta ${bet.externalId}...`);
            api.reportToDlq(bet, lastError).then(() => {
                log.info(`[SYNC-BET-FLOW] 9. Reporte de error fatal enviado exitosamente al backend.`);
            }).catch(err => {
                log.error(`[SYNC-BET-FLOW] ERROR: No se pudo reportar error fatal al backend para apuesta ${bet.externalId}`, err);
            });
        }

        return Result.error(error instanceof Error ? error : new Error(String(lastError)));
    }
};

/**
 * Flow for manual synchronization of all pending bets.
 */
export const syncPendingFlow = async (
    storage: IBetStorage,
    api: IBetApi
): Promise<{ success: number; failed: number; successBets: string[]; failedBets: { receiptCode: string; error: string }[] }> => {
    const pending = await storage.getPending();
    let success = 0;
    let failed = 0;
    const successBets: string[] = [];
    const failedBets: { receiptCode: string; error: string }[] = [];

    for (const bet of pending) {
        const res = await syncSingleBet(bet, storage, api);
        if (res.isOk()) {
            success++;
            successBets.push(bet.receiptCode || 'Sin código');
        } else {
            failed++;
            failedBets.push({
                receiptCode: bet.receiptCode || 'Sin código',
                error: res.error?.message || 'Error desconocido'
            });
        }
    }

    return { success, failed, successBets, failedBets };
};
