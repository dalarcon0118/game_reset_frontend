import { maintenanceRepository, IMaintenanceRepository } from '@/shared/repositories/system/maintenance/maintenance.repository';
import { betRepository, BetRepository } from '@/shared/repositories/bet/bet.repository';
import { drawRepository } from '@/shared/repositories/draw';
import { logger } from '@/shared/utils/logger';
import { TimerRepository } from '@/shared/repositories/system/time/timer.repository';

const log = logger.withTag('PREPARE_DAILY_SESSION');

/**
 * Dependencias inyectables para facilitar el testeo unitario.
 */
interface Dependencies {
    maintenanceRepo: IMaintenanceRepository;
    betRepo: BetRepository;
    drawRepo: typeof drawRepository;
}

const defaultDeps: Dependencies = {
    maintenanceRepo: maintenanceRepository,
    betRepo: betRepository,
    drawRepo: drawRepository
};

/**
 * Use Case: Preparar día operativo antes de cargar Dashboard (SSOT Local para Listeros)
 * 
 * Este caso de uso se encarga de:
 * 1. Aplicar mantenimiento de apuestas (bloqueo/reset nocturno).
 * 2. Validar que no haya apuestas críticas pendientes de sincronización del día anterior.
 * 3. Limpiar sorteos cacheados (se recargará del servidor).
 * 4. Marcar la fecha del último reset exitoso en el MaintenanceRepository.
 * 
 * NOTA: Los datos financieros se calculan ON-DEMAND desde BetRepository.
 * No se necesita cleanup del ledger - se calcula directamente desde las apuestas.
 */
export const prepareDailySessionUseCase = async (
    deps: Dependencies = defaultDeps
): Promise<boolean> => {
    console.log('[DEBUG] prepareDailySessionUseCase: INICIANDO...');
    // Usar hora del servidor para evitar problemas de timezone del dispositivo
    const trustedNow = await TimerRepository.getTrustedNow(Date.now());
    const trustedDate = new Date(trustedNow);
    const today = trustedDate.toISOString().split('T')[0];
    const todayStart = new Date(today).getTime();
    console.log('[DEBUG] prepareDailySessionUseCase: today =', today);

    try {
        log.info('Starting daily session preparation', { today });

        // 1. Aplicar mantenimiento de dominio de apuestas (Bloqueo, Reset Nocturno)
        console.log('[DEBUG] prepareDailySessionUseCase: applyMaintenance...');
        await deps.betRepo.applyMaintenance();
        console.log('[DEBUG] prepareDailySessionUseCase: applyMaintenance OK');

        // 2. Validar integridad: ¿Hay apuestas críticas sin sincronizar de ayer?
        console.log('[DEBUG] prepareDailySessionUseCase: hasCriticalPendingBets...');
        const hasCriticalBets = await deps.betRepo.hasCriticalPendingBets(todayStart);
        console.log('[DEBUG] prepareDailySessionUseCase: hasCriticalPendingBets =', hasCriticalBets);

        if (hasCriticalBets) {
            log.warn('Critical: Found pending/failed bets from previous sessions.');
        }

        // 3. Limpiar apuestas sincronizadas antiguas y marcar día como preparado (Paralelizado)
        console.log('[DEBUG] prepareDailySessionUseCase: Parallel cleanup and marking...');
        const [betCleaned, drawCleaned] = await Promise.all([
            deps.betRepo.cleanup(today),
            deps.drawRepo.cleanup(today),
            deps.maintenanceRepo.markDayAsPrepared(today)
        ]);
        
        console.log('[DEBUG] prepareDailySessionUseCase: cleanup OK', { betCleaned, drawCleaned });
        log.info('Cleanups completed', { betsRemoved: betCleaned, drawsRemoved: drawCleaned });

        console.log('[DEBUG] prepareDailySessionUseCase: COMPLETADO OK - retorna true');
        log.info('Daily session preparation completed successfully');
        return true;

    } catch (error) {
        console.log('[DEBUG] prepareDailySessionUseCase: ERROR', error);
        log.error('CRITICAL_ERROR: Daily session preparation failed', error);
        return false;
    }
};
