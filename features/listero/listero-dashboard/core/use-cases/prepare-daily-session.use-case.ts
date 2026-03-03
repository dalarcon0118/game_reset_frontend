import { maintenanceRepository, IMaintenanceRepository } from '@/shared/repositories/system/maintenance/maintenance.repository';
import { betRepository, BetRepository } from '@/shared/repositories/bet/bet.repository';
import { offlineJanitor, StorageJanitor } from '@/shared/core/offline-storage/instance';
import { Cleanup } from '@/shared/core/offline-storage/maintenance/criteria';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('PREPARE_DAILY_SESSION');

/**
 * Dependencias inyectables para facilitar el testeo unitario.
 */
interface Dependencies {
    maintenanceRepo: IMaintenanceRepository;
    betRepo: BetRepository;
    janitor: StorageJanitor;
}

const defaultDeps: Dependencies = {
    maintenanceRepo: maintenanceRepository,
    betRepo: betRepository,
    janitor: offlineJanitor
};

/**
 * Use Case: Preparar día operativo antes de cargar Dashboard (SSOT Local para Listeros)
 * 
 * Este caso de uso se encarga de:
 * 1. Verificar si ya se realizó el mantenimiento diario mediante el MaintenanceRepository.
 * 2. Si no se ha hecho:
 *    a. Aplicar mantenimiento de apuestas (bloqueo/reset nocturno).
 *    b. Validar que no haya apuestas críticas pendientes de sincronización del día anterior.
 *    c. Limpiar datos antiguos de sesión (sorteos, resúmenes) protegiendo apuestas pendientes.
 *    d. Marcar la fecha del último reset exitoso en el MaintenanceRepository.
 */
export const prepareDailySessionUseCase = async (
    deps: Dependencies = defaultDeps
): Promise<boolean> => {
    const today = new Date().toISOString().split('T')[0];
    const todayStart = new Date(today).getTime();

    try {
        // 1. Verificar si ya se hizo el mantenimiento hoy (Idempotencia)
        // Usamos MaintenanceRepository como SSOT del estado de la sesión
        if (await deps.maintenanceRepo.isDayPrepared(today)) {
            log.info('Daily reset already completed for today', { today });
            return true;
        }

        log.info('Starting daily session preparation', { today });

        // 2. Aplicar mantenimiento de dominio de apuestas (Bloqueo, Reset Nocturno)
        await deps.betRepo.applyMaintenance();

        // 3. Validar integridad: ¿Hay apuestas críticas sin sincronizar de ayer?
        const hasCriticalBets = await deps.betRepo.hasCriticalPendingBets(todayStart);

        if (hasCriticalBets) {
            log.warn('Critical: Found pending/failed bets from previous sessions.');
        }

        // 4. Limpieza de infraestructura (Limpieza de sesión antigua - Inversión de Control)
        // Definimos la política de limpieza aquí (Capa de Aplicación) para mantener el Janitor agnóstico.
        const cleanupPredicate = Cleanup.all(
            // Criterio temporal: todo lo creado antes de hoy
            Cleanup.olderThan(0, todayStart),
            // Filtro de protección: No borrar apuestas (el dominio decide qué proteger)
            Cleanup.where((_, key) => {
                // Las apuestas se protegen para sincronización manual posterior
                return !key.startsWith('bet:');
            })
        );

        await deps.janitor.clean(cleanupPredicate);

        // 5. Marcar reset como completado para hoy
        await deps.maintenanceRepo.markDayAsPrepared(today);

        log.info('Daily session preparation completed successfully');
        return true;

    } catch (error) {
        log.error('CRITICAL_ERROR: Daily session preparation failed', error);
        return false;
    }
};
