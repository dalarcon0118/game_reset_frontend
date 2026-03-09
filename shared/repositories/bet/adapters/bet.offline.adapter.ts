import { IBetStorage } from '../bet.ports';
import { BetDomainModel } from '../bet.types';
import { offlineStorage } from '@/shared/core/offline-storage/instance';
import { BetOfflineKeys } from '../bet.offline.keys';

/**
 * Adaptador de almacenamiento offline para apuestas que utiliza el motor agnóstico
 * Cumple con el puerto IBetStorage definido en el dominio de apuestas.
 * 
 * Nota: Los datos se almacenan sin TTL. Las apuestas pendientes se limpian
 * manualmente después de sincronizarse o mediante el flujo diario de cleanup.
 */
export class BetOfflineAdapter implements IBetStorage {

    /**
     * Guarda o actualiza una apuesta en el almacenamiento offline
     */
    async save(bet: BetDomainModel): Promise<void> {
        const id = bet.externalId || (bet as any).offlineId;
        const key = BetOfflineKeys.bet(id);
        // Sin TTL - las apuestas pendientes persisten hasta sincronización manual
        await offlineStorage.set(key, bet);
    }

    /**
     * Guarda un lote de apuestas en una sola operación
     */
    async saveBatch(bets: BetDomainModel[]): Promise<void> {
        const entries = bets.map(bet => {
            const id = bet.externalId || (bet as any).offlineId;
            return {
                key: BetOfflineKeys.bet(id),
                data: bet
            };
        });
        await offlineStorage.setMulti(entries);
    }

    /**
     * Obtiene todas las apuestas registradas.
     * NORMALIZA los datos para asegurar que cumplen con BetDomainModel (SSOT)
     * incluso si vienen de estructuras legacy o anidadas.
     */
    async getAll(): Promise<BetDomainModel[]> {
        const pattern = BetOfflineKeys.getPattern('pending', '*');
        const results = await offlineStorage.query<BetDomainModel>(pattern).all();
        return results.filter((b): b is BetDomainModel => b !== null);
    }

    /**
     * Obtiene apuestas filtradas por fecha y estructura (SSOT)
     */
    async getFiltered(filters: { todayStart: number; structureId?: string }): Promise<BetDomainModel[]> {
        const all = await this.getAll();
        const todayEnd = filters.todayStart + (24 * 60 * 60 * 1000);

        return all.filter((bet) => {
            const timestamp = Number(bet.timestamp) || 0;
            const isToday = timestamp >= filters.todayStart && timestamp < todayEnd;
            const matchesStructure = !filters.structureId || String(bet.ownerStructure) === String(filters.structureId);
            return isToday && matchesStructure;
        });
    }

    /**
     * Obtiene las apuestas pendientes de sincronizar
     */
    async getPending(): Promise<BetDomainModel[]> {
        const all = await this.getAll();
        return all.filter(b => b.status === 'pending' || b.status === 'error');
    }

    /**
     * Obtiene apuestas por estado
     */
    async getByStatus(status: BetDomainModel['status']): Promise<BetDomainModel[]> {
        const all = await this.getAll();
        return all.filter(b => b.status === status);
    }

    /**
     * Obtiene apuestas recientes (pendientes o sincronizadas) para un sorteo específico.
     * Útil para cubrir la ventana de latencia del backend tras una sincronización exitosa.
     */
    async getRecentByDraw(drawId: string | number, maxAgeMs: number = 60 * 60 * 1000): Promise<BetDomainModel[]> {
        const all = await this.getAll();
        const normalizedDrawId = String(drawId);
        const now = Date.now();

        return all.filter(b => {
            const matchesDraw = String(b.drawId) === normalizedDrawId;
            const isPending = b.status === 'pending' || b.status === 'error';
            const isRecentSynced = b.status === 'synced' && (now - (b.timestamp || 0)) < maxAgeMs;

            return matchesDraw && (isPending || isRecentSynced);
        });
    }

    /**
     * Actualiza el estado de una apuesta
     */
    async updateStatus(offlineId: string, status: BetDomainModel['status'], extra?: Partial<BetDomainModel>): Promise<void> {
        const key = BetOfflineKeys.bet(offlineId);
        const bet = await offlineStorage.get<BetDomainModel>(key);

        if (bet) {
            const updatedBet = { ...bet, status, ...extra };
            await this.save(updatedBet);
        }
    }

    /**
     * Elimina una apuesta del almacenamiento
     */
    async delete(offlineId: string): Promise<void> {
        const key = BetOfflineKeys.bet(offlineId);
        await offlineStorage.remove(key);
    }

    /**
     * Obtiene apuestas por sorteo
     */
    async getByDraw(drawId: string | number): Promise<BetDomainModel[]> {
        const all = await this.getAll();
        const normalizedDrawId = String(drawId);
        return all.filter(b => {
            if (!b) return false;
            return String(b.drawId) === normalizedDrawId;
        });
    }
}
