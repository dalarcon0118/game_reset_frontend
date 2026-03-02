import { IBetStorage } from '../bet.ports';
import { BetDomainModel } from '../bet.types';
import { offlineStorage } from '@/shared/core/offline-storage/instance';
import { BetOfflineKeys } from '../bet.offline.keys';

/**
 * Adaptador de almacenamiento offline para apuestas que utiliza el motor agnóstico
 * Cumple con el puerto IBetStorage definido en el dominio de apuestas.
 */
export class BetOfflineAdapter implements IBetStorage {

    /**
     * Guarda o actualiza una apuesta en el almacenamiento offline
     */
    async save(bet: BetDomainModel): Promise<void> {
        const key = BetOfflineKeys.bet(bet.offlineId, 'data');
        await offlineStorage.set(key, bet);

        // Guardar metadata de sync por separado para búsquedas rápidas (Redis-style indexing)
        const syncKey = BetOfflineKeys.bet(bet.offlineId, 'sync');
        await offlineStorage.set(syncKey, {
            status: bet.status,
            timestamp: bet.timestamp,
            drawId: bet.data.draw
        });
    }

    /**
     * Obtiene todas las apuestas registradas
     */
    async getAll(): Promise<BetDomainModel[]> {
        const pattern = BetOfflineKeys.getPattern('pending', '*', 'data');
        return await offlineStorage.query<BetDomainModel>(pattern).all();
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
     * Actualiza el estado de una apuesta
     */
    async updateStatus(offlineId: string, status: BetDomainModel['status'], extra?: Partial<BetDomainModel>): Promise<void> {
        const key = BetOfflineKeys.bet(offlineId, 'data');
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
        const pattern = BetOfflineKeys.getPattern('pending', offlineId, '*');
        await offlineStorage.clear(pattern);
    }

    /**
     * Obtiene apuestas por sorteo (Optimizado usando patrones de llave)
     */
    async getByDraw(drawId: string | number): Promise<BetDomainModel[]> {
        const all = await this.getAll();
        const normalizedDrawId = String(drawId);
        return all.filter(b => String(b.data.draw) === normalizedDrawId);
    }
}
