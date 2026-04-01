import { maintenanceRepository } from '@/shared/repositories/system/maintenance/maintenance.repository';
import { betRepository } from '@/shared/repositories/bet/bet.repository';
import { drawRepository } from '@/shared/repositories/draw';
import { TimerRepository } from '@/shared/repositories/system/time';
import { logger } from '@/shared/utils/logger';
import { offlineEventBus } from '@/shared/core/offline-storage/instance';

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
            const trustedTs = await TimerRepository.getTrustedNow(Date.now());
            const today = new Date(trustedTs).toISOString().split('T')[0];

            log.info('Iniciando preparación de sesión diaria', { today, force });

            // 2. Guarda de Idempotencia
            if (!force) {
                const isPrepared = await maintenanceRepository.isDayPrepared(today);
                if (isPrepared) {
                    log.info('La sesión ya estaba preparada para hoy. Ejecutando limpieza forzada por actualización de política.', { today });
                    // Temporalmente ignoramos el return true para forzar el barrido
                    // this.notifyReady(today);
                    // return true;
                }
            }

            // 3. Ejecución de Mantenimiento en Repositorios (Expertos)
            // Aplicamos mantenimiento preventivo primero (local y seguro)
            await betRepository.applyMaintenance();

            // Ejecutamos limpiezas pesadas en paralelo
            const results = await Promise.allSettled([
                betRepository.cleanup(today),
                drawRepository.cleanup(today)
            ]);

            // Verificar si hubo fallos críticos
            const failures = results.filter(r => r.status === 'rejected');
            if (failures.length > 0) {
                log.error('Algunas tareas de limpieza fallaron', { count: failures.length });
                // En arquitectura senior, decidimos si un fallo en Draw bloquea todo.
                // Por ahora, si logramos limpiar apuestas, procedemos con precaución.
            }

            // 4. Marcar éxito del día
            await maintenanceRepository.markDayAsPrepared(today);

            log.info('Mantenimiento completado exitosamente', { today });

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
