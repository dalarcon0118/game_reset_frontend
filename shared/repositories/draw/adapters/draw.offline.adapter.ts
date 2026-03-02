import { BackendDraw, BetType } from '../api/types';
import { offlineStorage } from '@/shared/core/offline-storage/instance';
import { DrawOfflineKeys } from '../draw.offline.keys';

/**
 * Adaptador de almacenamiento offline para Sorteos (Draws)
 * Utiliza el motor agnóstico con patrones tipo Redis.
 */
export class DrawOfflineAdapter {

    /**
     * Cachea la lista completa de sorteos
     */
    async saveDraws(draws: BackendDraw[]): Promise<void> {
        // Guardamos la lista completa para acceso rápido
        const key = DrawOfflineKeys.drawList();
        await offlineStorage.set(key, draws);

        // También guardamos cada sorteo individualmente para permitir consultas por ID (Redis-style)
        for (const draw of draws) {
            const individualKey = DrawOfflineKeys.draw(String(draw.id), 'data');
            await offlineStorage.set(individualKey, draw);
        }
    }

    /**
     * Obtiene todos los sorteos cacheados
     */
    async getAll(): Promise<BackendDraw[]> {
        const key = DrawOfflineKeys.drawList();
        const list = await offlineStorage.get<BackendDraw[]>(key);

        if (list) return list;

        // Si la lista no existe, intentamos reconstruirla desde las llaves individuales
        const pattern = DrawOfflineKeys.getPattern('instance', '*', 'data');
        return await offlineStorage.query<BackendDraw>(pattern).all();
    }

    /**
     * Obtiene un sorteo por ID
     */
    async getById(id: string | number): Promise<BackendDraw | null> {
        const key = DrawOfflineKeys.draw(String(id), 'data');
        return await offlineStorage.get<BackendDraw>(key);
    }

    /**
     * Cachea los tipos de apuesta de un sorteo
     */
    async saveBetTypes(drawId: string | number, betTypes: BetType[]): Promise<void> {
        const key = DrawOfflineKeys.betType(String(drawId), 'list');
        await offlineStorage.set(key, betTypes);
    }

    /**
     * Obtiene los tipos de apuesta cacheados de un sorteo
     */
    async getBetTypes(drawId: string | number): Promise<BetType[] | null> {
        const key = DrawOfflineKeys.betType(String(drawId), 'list');
        return await offlineStorage.get<BetType[]>(key);
    }

    /**
     * Limpia la caché de sorteos
     */
    async clear(): Promise<void> {
        const pattern = DrawOfflineKeys.getPattern('instance', '*', '*');
        await offlineStorage.clear(pattern);
    }
}
