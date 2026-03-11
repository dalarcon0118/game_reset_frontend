import { BackendDraw, BetType } from '../api/types/types';
import { offlineStorage } from '@/shared/core/offline-storage/instance';
import { DrawOfflineKeys } from '../draw.offline.keys';
import { STORAGE_TTL } from '@/shared/core/offline-storage/types';

/**
 * Adaptador de almacenamiento offline para Sorteos (Draws)
 * Utiliza el motor agnóstico con patrones tipo Redis.
 * 
 * Los datos se cachean con TTL para permitir operación offline
 * mientras se mantiene el almacenamiento limpio.
 */
export class DrawOfflineAdapter {

    /**
     * Cachea la lista completa de sorteos
     * @param draws - Lista de sorteos a cachear
     * @param structureId - Opcional: ID de la estructura para segmentar la caché
     */
    async saveDraws(draws: BackendDraw[], structureId?: string | number): Promise<void> {
        // Guardamos la lista completa para acceso rápido (segmentada o global)
        const key = DrawOfflineKeys.drawList(structureId);
        await offlineStorage.set(key, draws, { ttl: STORAGE_TTL.DRAW });

        // También guardamos cada sorteo individualmente para permitir consultas por ID (Redis-style)
        for (const draw of draws) {
            const individualKey = DrawOfflineKeys.draw(String(draw.id), 'data');
            await offlineStorage.set(individualKey, draw, { ttl: STORAGE_TTL.DRAW });
        }
    }

    /**
     * Obtiene todos los sorteos cacheados
     * @param structureId - Opcional: ID de la estructura para buscar en caché segmentada
     */
    async getAll(structureId?: string | number): Promise<BackendDraw[]> {
        // 1. Intentar obtener la lista segmentada por estructura
        if (structureId) {
            const segmentedKey = DrawOfflineKeys.drawList(structureId);
            const segmentedList = await offlineStorage.get<BackendDraw[]>(segmentedKey);
            if (segmentedList) return segmentedList;
        }

        // 2. Fallback: Intentar obtener la lista global (legacy)
        const globalKey = DrawOfflineKeys.drawList();
        const globalList = await offlineStorage.get<BackendDraw[]>(globalKey);
        if (globalList) return globalList;

        // 3. Fallback Final: Reconstruir desde llaves individuales
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
        await offlineStorage.set(key, betTypes, { ttl: STORAGE_TTL.BET_TYPE });
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

    /**
     * Borra un sorteo individual por ID
     */
    async deleteDraw(id: string | number): Promise<void> {
        const key = DrawOfflineKeys.draw(String(id), 'data');
        const financialKey = DrawOfflineKeys.draw(String(id), 'financial');
        const resultsKey = DrawOfflineKeys.draw(String(id), 'results');
        const betTypesKey = DrawOfflineKeys.betType(String(id), 'list');

        await offlineStorage.removeMulti([
            key,
            financialKey,
            resultsKey,
            betTypesKey
        ]);
    }

    /**
     * Limpia solo las llaves de listas de sorteos (caché de listas)
     * Esto fuerza al repositorio a pedir listas nuevas al servidor,
     * pero mantiene los sorteos individuales en caché.
     */
    async clearLists(): Promise<void> {
        // Borrar llaves que contienen 'list' en el ID
        const listPattern = DrawOfflineKeys.getPattern('instance', 'list*', 'data');
        await offlineStorage.clear(listPattern);
    }
}
