import { offlineStorage } from '@core/offline-storage/instance';
import { SystemOfflineKeys } from '@/shared/repositories/financial/financial.offline.keys';

/**
 * Puerto para el mantenimiento del sistema.
 */
export interface IMaintenanceRepository {
    isDayPrepared(date: string): Promise<boolean>;
    markDayAsPrepared(date: string): Promise<void>;
}

/**
 * Repositorio de mantenimiento (SSOT para el estado de la sesión).
 * Desacoplado de los datos financieros del servidor.
 */
export class MaintenanceRepository implements IMaintenanceRepository {
    
    /**
     * Verifica si el mantenimiento/reset diario ya se ha realizado para una fecha dada.
     */
    async isDayPrepared(date: string): Promise<boolean> {
        const lastReset = await this.getLastResetDate();
        return lastReset === date;
    }

    /**
     * Marca el mantenimiento/reset diario como completado para una fecha dada.
     */
    async markDayAsPrepared(date: string): Promise<void> {
        const key = SystemOfflineKeys.config('maintenance', 'last_reset');
        await offlineStorage.set(key, { date, timestamp: Date.now() });
    }

    private async getLastResetDate(): Promise<string | null> {
        const key = SystemOfflineKeys.config('maintenance', 'last_reset');
        const data = await offlineStorage.get<{ date: string }>(key);
        return data?.date || null;
    }
}

export const maintenanceRepository = new MaintenanceRepository();
