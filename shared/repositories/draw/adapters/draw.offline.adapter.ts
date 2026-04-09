import { BackendDraw, BetType } from '../api/types/types';
import { offlineStorage } from '@core/offline-storage/instance';
import { DrawOfflineKeys } from '../draw.offline.keys';
import { STORAGE_TTL } from '@core/offline-storage/types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('DrawOfflineAdapter');

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
        const key = DrawOfflineKeys.drawList(structureId);
        log.debug('[saveDraws] Guardando sorteos en caché', {
            structureId,
            key,
            drawCount: draws.length,
            drawIds: draws.map(d => d.id)
        });
        await offlineStorage.set(key, draws, { ttl: STORAGE_TTL.DRAW });

        for (const draw of draws) {
            const individualKey = DrawOfflineKeys.draw(String(draw.id), 'data');
            await offlineStorage.set(individualKey, draw, { ttl: STORAGE_TTL.DRAW });
        }
        log.debug('[saveDraws] Sorteos guardados exitosamente', { structureId, count: draws.length });
    }

    /**
     * Obtiene todos los sorteos cacheados
     * @param structureId - Opcional: ID de la estructura para buscar en caché segmentada
     *
     * CRITICAL FIX: Cuando se especifica structureId, NO se hace fallback a lista global.
     * Esto previene que datos de un banco se mezclen con otro cuando diferentes usuarios
     * (de diferentes bancos) usan el mismo dispositivo.
     */
    async getAll(structureId?: string | number): Promise<BackendDraw[]> {
        log.debug('[getAll] Solicitud de obtención de sorteos', { structureId });

        if (structureId) {
            const segmentedKey = DrawOfflineKeys.drawList(structureId);
            log.debug('[getAll] Buscando caché segmentada', { structureId, key: segmentedKey });

            const segmentedList = await offlineStorage.get<BackendDraw[]>(segmentedKey);

            if (segmentedList) {
                log.debug('[getAll] Cache HIT segmentada (lista)', {
                    structureId,
                    key: segmentedKey,
                    count: segmentedList.length
                });
                return segmentedList;
            }

            // FALLBACK: Si no hay lista segmentada, buscamos sorteos individuales
            log.debug('[getAll] Cache MISS lista segmentada - Buscando sorteos individuales por patrón', { structureId });
            const pattern = DrawOfflineKeys.getPattern('instance', '*', 'data');
            const allIndividualDraws = await offlineStorage.query<BackendDraw>(pattern).all();

            // Filtrar los sorteos que pertenecen a esta estructura
            const filteredByStructure = allIndividualDraws.filter(draw =>
                String(draw.owner_structure) === String(structureId)
            );

            if (filteredByStructure.length > 0) {
                log.info('[getAll] Cache HIT individual (reconstrucción desde registros)', {
                    structureId,
                    count: filteredByStructure.length
                });
                return filteredByStructure;
            }

            log.debug('[getAll] No se encontraron sorteos (lista ni individuales) para la estructura', { structureId });
            return [];
        }

        log.debug('[getAll] Sin structureId - usando fallback global');
        const globalKey = DrawOfflineKeys.drawList();
        const globalList = await offlineStorage.get<BackendDraw[]>(globalKey);

        if (globalList) {
            log.debug('[getAll] Cache HIT global', { count: globalList.length });
            return globalList;
        }

        log.warn('[getAll] Fallback global DENEGADO - sin structureId no se puede garantizar seguridad de datos. Se requieren sorteos segmentados por estructura.');
        return [];
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
