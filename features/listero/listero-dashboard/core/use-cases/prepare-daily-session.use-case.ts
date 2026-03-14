import { maintenanceRepository, IMaintenanceRepository } from '@/shared/repositories/system/maintenance/maintenance.repository';
import { betRepository, BetRepository } from '@/shared/repositories/bet/bet.repository';
import { drawRepository } from '@/shared/repositories/draw';
import { logger } from '@/shared/utils/logger';
import { TimerRepository } from '@/shared/repositories/system/time';

const log = logger.withTag('PREPARE_DAILY_SESSION');

/**
 * Dependencias inyectables para facilitar el testeo unitario.
 */
interface Dependencies {
    maintenanceRepo: IMaintenanceRepository;
    betRepo: BetRepository;
    drawRepo: typeof drawRepository;
    timerRepo: typeof TimerRepository;
}

const defaultDeps: Dependencies = {
    maintenanceRepo: maintenanceRepository,
    betRepo: betRepository,
    drawRepo: drawRepository,
    timerRepo: TimerRepository
};

/**
 * Use Case: Preparar día operativo antes de cargar Dashboard (SSOT Local para Listeros)
 * 
 * Este caso de uso se encarga de:
 * 1. Aplicar mantenimiento de apuestas (bloqueo/reset nocturno).
 * 2. Limpiar sorteos cacheados (se recargará del servidor).
 * 3. Marcar la fecha del último reset exitoso en el MaintenanceRepository.
 * 
 * NOTA: Los datos financieros se calculan ON-DEMAND desde BetRepository.
 * No se necesita cleanup del ledger - se calcula directamente desde las apuestas.
 */
export const prepareDailySessionUseCase = async (
    deps: Dependencies = defaultDeps
): Promise<boolean> => {
    try {
        const timestamp = deps.timerRepo.getTrustedNow(Date.now());
        const today = new Date(timestamp).toISOString().split('T')[0];

        console.log('[DEBUG] prepareDailySessionUseCase: Iniciando preparación para', today);

        // 1. Aplicar mantenimiento a las apuestas (cleanup de fallidas, recuperación de stuck)
        // Esto es local y seguro de ejecutar siempre
        await deps.betRepo.applyMaintenance();

        // 2. Ejecutar limpiezas y marcar día como preparado
        // Usamos Promise.allSettled para que un fallo en red no bloquee todo el proceso
        const results = await Promise.allSettled([
            deps.betRepo.cleanup(today),
            deps.drawRepo.cleanup(today),
            deps.maintenanceRepo.markDayAsPrepared(today)
        ]);

        // Loguear resultados para diagnóstico
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error(`[DEBUG] prepareDailySessionUseCase: Tarea ${index} falló:`, result.reason);
            }
        });

        // Consideramos éxito si al menos logramos marcar el día como preparado localmente
        // o si el error fue solo de red en el cleanup (que ahora es selectivo)
        const dayMarked = results[2].status === 'fulfilled';

        if (!dayMarked) {
            console.warn('[DEBUG] prepareDailySessionUseCase: No se pudo marcar el día como preparado, pero procedemos');
        }

        return true;

    } catch (error) {
        console.error('[DEBUG] prepareDailySessionUseCase: Error crítico en preparación:', error);
        // Fallback: Siempre retornar true para no bloquear el Dashboard si el login fue exitoso
        return true;
    }
};
