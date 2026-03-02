import { FinancialSummary } from '@/types';
import { offlineStorage } from '@/shared/core/offline-storage/instance';
import { SystemOfflineKeys } from '../financial.offline.keys';

/**
 * Adaptador de almacenamiento offline para el resumen financiero
 * Utiliza el motor agnóstico para persistir datos financieros temporales (24h).
 */
export class SummaryOfflineAdapter {

    /**
     * Guarda el resumen financiero actual
     */
    async saveSummary(summary: FinancialSummary): Promise<void> {
        const key = SystemOfflineKeys.summary('current');
        // TTL de 24h para el resumen
        await offlineStorage.set(key, summary, 24 * 60 * 60 * 1000);
    }

    /**
     * Obtiene el resumen financiero guardado
     */
    async getSummary(): Promise<FinancialSummary | null> {
        const key = SystemOfflineKeys.summary('current');
        return await offlineStorage.get<FinancialSummary>(key);
    }

    /**
     * Gestiona la fecha del último reset nocturno
     */
    async setLastResetDate(date: string): Promise<void> {
        const key = SystemOfflineKeys.config('maintenance', 'last_reset');
        await offlineStorage.set(key, { date, timestamp: Date.now() });
    }

    async getLastResetDate(): Promise<string | null> {
        const key = SystemOfflineKeys.config('maintenance', 'last_reset');
        const data = await offlineStorage.get<{ date: string }>(key);
        return data?.date || null;
    }

    /**
     * Limpia todos los datos del resumen
     */
    async clearSummary(): Promise<void> {
        const key = SystemOfflineKeys.summary('current');
        await offlineStorage.remove(key);
    }
}
