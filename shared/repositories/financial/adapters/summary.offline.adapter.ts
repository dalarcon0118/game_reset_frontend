import { FinancialSummary } from '@/types';
import { offlineStorage } from '@/shared/core/offline-storage/instance';
import { SystemOfflineKeys } from '../financial.offline.keys';
import { STORAGE_TTL } from '@/shared/core/offline-storage/types';

/**
 * Adaptador de almacenamiento offline para el resumen financiero
 * Utiliza el motor agnóstico para persistir datos financieros temporales.
 * 
 * Los datos se cachean con TTL para mantenerlos frescos.
 */
export class SummaryOfflineAdapter {

    /**
     * Guarda el resumen financiero actual
     */
    async saveSummary(summary: FinancialSummary): Promise<void> {
        const key = SystemOfflineKeys.summary('current');
        await offlineStorage.set(key, summary, { ttl: STORAGE_TTL.SUMMARY });
    }

    /**
     * Obtiene el resumen financiero guardado
     */
    async getSummary(): Promise<FinancialSummary | null> {
        const key = SystemOfflineKeys.summary('current');
        return await offlineStorage.get<FinancialSummary>(key);
    }

    /**
     * Limpia todos los datos del resumen
     */
    async clearSummary(): Promise<void> {
        const key = SystemOfflineKeys.summary('current');
        await offlineStorage.remove(key);
    }
}
