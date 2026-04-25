import { maintenanceRepository } from '@/shared/repositories/system/maintenance/maintenance.repository';
import { betRepository } from '@/shared/repositories/bet/bet.repository';
import { drawRepository } from '@/shared/repositories/draw';
import { TimerRepository } from '@/shared/repositories/system/time';
import { notificationRepository } from '@/shared/repositories/notification';
import { logger } from '@/shared/utils/logger';
import { offlineEventBus, SyncAdapter } from '@/shared/core/offline-storage/instance';
import { telemetryRepository } from '@/shared/repositories/system/telemetry';

const log = logger.withTag('SYSTEM_JANITOR');

/**
 * SystemJanitor - Servicio de Orquestación de Mantenimiento y Limpieza.
 * 
 * Ubicado en CoreModule para centralizar la salud del sistema offline.
 * Sigue un enfoque reactivo y desacoplado de la UI.
 */
export class SystemJanitor {
    private static instance: SystemJanitor;
    private isProcessing = false;

    private constructor() { }

    static getInstance(): SystemJanitor {
        if (!this.instance) {
            this.instance = new SystemJanitor();
        }
        return this.instance;
    }

    /**
     * Orquesta el mantenimiento diario del sistema.
     * Verifica idempotencia y ejecuta limpiezas en los repositorios expertos.
     * 
     * @param force Si es true, ignora la guarda de idempotencia (isDayPrepared)
     */
    async prepareDailySession(force = false): Promise<boolean> {
        if (this.isProcessing) {
            log.debug('prepareDailySession: Ya hay un proceso en curso, omitiendo.');
            return false;
        }

        try {
            this.isProcessing = true;

            // 1. Obtener tiempo confiable (SSOT Time)
            // trustedTs es la hora del servidor ajustada por el offset cliente/servidor.
            // new Date(trustedTs) interpreta el timestamp en hora LOCAL del dispositivo.
            // Usamos getFullYear/getMonth/getDate (LOCAL) en lugar de toISOString (UTC)
            // para que el día coincida con la hora local del servidor.
            const trustedTs = TimerRepository.getTrustedNow(Date.now());
            const trustedDate = new Date(trustedTs);
            const year = trustedDate.getFullYear();
            const month = String(trustedDate.getMonth() + 1).padStart(2, '0');
            const day = String(trustedDate.getDate()).padStart(2, '0');
            const today = `${year}-${month}-${day}`;

            log.info('[DIAGNOSTIC] Fecha calculada para cleanup', {
                today,
                trustedTs,
                localDate: new Date().toISOString(),
                serverOffset: TimerRepository.getTrustedNow(Date.now()) - Date.now(),
                trustedDate: trustedDate.toISOString()
            });

            log.info('Iniciando preparación de sesión diaria', { today, force });

            // 2. Guarda de Idempotencia
            if (!force) {
                const isPrepared = await maintenanceRepository.isDayPrepared(today);
                if (isPrepared) {
                    log.info('La sesión ya estaba preparada para hoy. Omitiendo mantenimiento redundante.', { today });
                    this.notifyReady(today);
                    return true;
                }
            }

            // 3. Aplicar mantenimiento preventivo (local y seguro)
            await betRepository.applyMaintenance();

            // 4. Sincronizar apuestas pendientes ANTES de limpiar
            const pendingBets = await betRepository.getPendingBets();
            log.info('[DIAGNOSTIC] Verificacion de sync', {
                pendingBetsCount: pendingBets.length,
                today
            });

            let syncedCount = 0;
            if (pendingBets.length > 0) {
                const online = await (async () => {
                    try {
                        const { isServerReachable } = await import('@/shared/utils/network');
                        return await isServerReachable();
                    } catch {
                        return false;
                    }
                })();

                log.info('[DIAGNOSTIC] Estado de conectividad', { online });

                if (online) {
                    const syncResult = await betRepository.syncPending();
                    syncedCount = syncResult.success;
                    log.info('[DIAGNOSTIC] Resultado de syncPending', {
                        success: syncResult.success,
                        failed: syncResult.failed,
                        structureTotalCollected: syncResult.structureTotalCollected,
                        structureId: syncResult.structureId,
                        successBets: syncResult.successBets
                    });
                    if (syncResult.structureTotalCollected !== undefined && syncResult.structureId !== undefined) {
                        const localSummary = await betRepository.getFinancialSummary(
                            trustedTs,
                            String(syncResult.structureId)
                        );
                        const localTotal = localSummary.totalCollected;

                        log.info('[DIAGNOSTIC] Comparacion de balances', {
                            localTotal,
                            backendTotal: syncResult.structureTotalCollected,
                            difference: localTotal - syncResult.structureTotalCollected,
                            match: localTotal === syncResult.structureTotalCollected
                        });

                        if (localTotal === syncResult.structureTotalCollected) {
                            await notificationRepository.addNotification({
                                title: '✅ Sincronizacion verificada',
                                message: `Balance verificado: RD$${localTotal.toLocaleString()} (${localSummary.betCount} apuestas)`,
                                type: 'success',
                                metadata: {
                                    action: 'JANITOR_SYNC_VERIFIED',
                                    localTotal,
                                    backendTotal: syncResult.structureTotalCollected,
                                    betCount: localSummary.betCount,
                                    syncedCount: syncResult.success,
                                    today
                                }
                            });
                        } else if (localTotal < syncResult.structureTotalCollected) {
                            await notificationRepository.addNotification({
                                title: '⚠️ Apuestas faltantes',
                                message: `Balance local RD$${localTotal.toLocaleString()} < Balance servidor RD$${syncResult.structureTotalCollected.toLocaleString()}. Intentando recuperar...`,
                                type: 'warning',
                                metadata: {
                                    action: 'JANITOR_SYNC_MISMATCH_LESS',
                                    localTotal,
                                    backendTotal: syncResult.structureTotalCollected,
                                    betCount: localSummary.betCount,
                                    syncedCount: syncResult.success,
                                    today
                                }
                            });
                        } else {
                            await notificationRepository.addNotification({
                                title: '🚨 Error de sincronizacion',
                                message: `Balance local RD$${localTotal.toLocaleString()} > Balance servidor RD$${syncResult.structureTotalCollected.toLocaleString()}. Verificar...`,
                                type: 'error',
                                metadata: {
                                    action: 'JANITOR_SYNC_MISMATCH_GREATER',
                                    localTotal,
                                    backendTotal: syncResult.structureTotalCollected,
                                    betCount: localSummary.betCount,
                                    syncedCount: syncResult.success,
                                    today
                                }
                            });
                        }
                    } else {
                        log.warn('[DIAGNOSTIC] syncPending no retorno structureTotalCollected', { syncResult });
                    }
                } else {
                    log.info('[DIAGNOSTIC] Offline, omitiendo verificacion de sync');
                }
            } else {
                log.info('[DIAGNOSTIC] No hay apuestas pendientes, omitiendo verificacion de sync');
            }

            // 5. Ejecutar limpiezas pesadas en paralelo (después de sincronizar)
            const results = await Promise.allSettled([
                betRepository.cleanup(today),
                drawRepository.cleanup(today),
                telemetryRepository.cleanup(7),
                SyncAdapter.cleanup(7, 24)
            ]);

            const failures = results.filter(r => r.status === 'rejected');
            const betDeleted = results[0].status === 'fulfilled' ? results[0].value : 0;
            const drawDeleted = results[1].status === 'fulfilled' ? results[1].value : 0;
            const telemetryDeleted = results[2].status === 'fulfilled' ? results[2].value : 0;
            const syncQueueDeleted = results[3].status === 'fulfilled' ? results[3].value : 0;

            if (failures.length > 0) {
                log.error('Algunas tareas de limpieza fallaron', { count: failures.length });
            }

            // 6. Marcar éxito del día
            await maintenanceRepository.markDayAsPrepared(today);

            // 7. Notificar al usuario del resultado del mantenimiento
            if (failures.length > 0) {
                await notificationRepository.addNotification({
                    title: '⚠️ Mantenimiento con errores',
                    message: `Se realizó mantenimiento de sesión. ${syncedCount > 0 ? `${syncedCount} apuesta(s) antigua(s) sincronizada(s) y limpiada(s).` : ''} ${betDeleted - syncedCount > 0 ? `${betDeleted - syncedCount} apuesta(s) pendiente(s) limpiada(s).` : ''} ${drawDeleted > 0 ? `${drawDeleted} sorteo(s) antiguo(s) limpiado(s).` : ''} ${telemetryDeleted > 0 ? `${telemetryDeleted} evento(s) de telemetría limpiado(s).` : ''} ${syncQueueDeleted > 0 ? `${syncQueueDeleted} item(s) de cola de sync limpiado(s).` : ''} Algunos elementos no pudieron procesarse.`,
                    type: 'warning',
                    metadata: {
                        action: 'JANITOR_CLEANUP',
                        deletedBets: betDeleted,
                        syncedBets: syncedCount,
                        deletedDraws: drawDeleted,
                        deletedTelemetry: telemetryDeleted,
                        deletedSyncQueue: syncQueueDeleted,
                        today,
                        hadErrors: true
                    }
                });
            } else {
                await notificationRepository.addNotification({
                    title: '🔄 Mantenimiento completado',
                    message: `Sesión diaria iniciada correctamente para el ${today}. ${syncedCount > 0 ? `${syncedCount} apuesta(s) antigua(s) sincronizada(s) y limpiada(s).` : 'No había apuestas pendientes.'} ${drawDeleted > 0 ? `${drawDeleted} sorteo(s) antiguo(s) limpiado(s).` : ''} ${telemetryDeleted > 0 ? `${telemetryDeleted} evento(s) de telemetría limpiado(s).` : ''} ${syncQueueDeleted > 0 ? `${syncQueueDeleted} item(s) de cola de sync limpiado(s).` : ''}`,
                    type: 'info',
                    metadata: {
                        action: 'JANITOR_CLEANUP',
                        deletedBets: betDeleted,
                        syncedBets: syncedCount,
                        deletedDraws: drawDeleted,
                        deletedTelemetry: telemetryDeleted,
                        deletedSyncQueue: syncQueueDeleted,
                        today,
                        hadErrors: false
                    }
                });
            }

            log.info('Mantenimiento completado exitosamente', { today, betDeleted, drawDeleted, telemetryDeleted, syncQueueDeleted });

            // 5. Notificar al sistema mediante el Bus de Eventos
            this.notifyReady(today);

            return true;

        } catch (error) {
            log.error('Error crítico durante el mantenimiento del sistema', error);
            return false;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Notifica a través del bus de eventos que el sistema está listo.
     */
    private notifyReady(date: string): void {
        offlineEventBus.publish({
            type: 'MAINTENANCE_COMPLETED',
            entity: 'system',
            payload: { date, status: 'ready' },
            timestamp: Date.now()
        });
    }
}

export const systemJanitor = SystemJanitor.getInstance();
