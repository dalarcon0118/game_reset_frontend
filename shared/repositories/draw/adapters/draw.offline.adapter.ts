import { BackendDraw, BetType } from '../api/types/types';
import { offlineStorage } from '@core/offline-storage/instance';
import { DrawOfflineKeys } from '../draw.offline.keys';
import { STORAGE_TTL } from '@core/offline-storage/types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('DrawOfflineAdapter');

export class DrawOfflineAdapter {

    /**
     * Infiere el ID del banco desde los draws recibidos del backend.
     * Cuando el backend responde, los draws tienen owner_structure = ID del banco (no del hijo).
     * @param draws - Lista de draws del backend
     * @returns El owner_structure del banco si está presente, o null
     */
    private getBankIdFromDraws(draws: BackendDraw[]): string | number | null {
        if (!draws || draws.length === 0) {
            return null;
        }
        const firstDraw = draws[0];
        if (firstDraw && firstDraw.owner_structure) {
            return firstDraw.owner_structure;
        }
        return null;
    }

    /**
     * Cachea la lista completa de sorteos
     * @param draws - Lista de sorteos a cachear
     * @param structureId - ID de la estructura del usuario (hijo)
     */
    async saveDraws(draws: BackendDraw[], structureId?: string | number): Promise<void> {
        // Guardar en la clave específica del usuario (estructura hijo)
        const userKey = DrawOfflineKeys.drawList(structureId);
        log.debug('[saveDraws] Guardando sorteos en caché', {
            structureId,
            key: userKey,
            drawCount: draws.length,
            drawIds: draws.map(d => d.id)
        });
        await offlineStorage.set(userKey, draws, { ttl: STORAGE_TTL.DRAW });

        // También guardar en la clave del banco (padre) si podemos inferirlo
        if (draws && draws.length > 0) {
            const bankId = this.getBankIdFromDraws(draws);
            if (bankId && bankId !== structureId) {
                const bankKey = DrawOfflineKeys.drawList(bankId);
                log.debug('[saveDraws] También guardando en caché del banco', {
                    structureId,
                    bankId,
                    bankKey,
                    drawCount: draws.length
                });
                await offlineStorage.set(bankKey, draws, { ttl: STORAGE_TTL.DRAW });
            }
        }

        // Guardar sorteos individuales
        for (const draw of draws) {
            const individualKey = DrawOfflineKeys.draw(String(draw.id), 'data');
            await offlineStorage.set(individualKey, draw, { ttl: STORAGE_TTL.DRAW });
        }
        log.debug('[saveDraws] Sorteos guardados exitosamente', { structureId, count: draws.length });
    }

    /**
     * Obtiene todos los sorteos cacheados
     * @param structureId - ID de la estructura del usuario
     * 
     * Flujo de búsqueda jerárquica:
     * 1. Buscar en clave del hijo (structureId)
     * 2. Si no hay datos, buscar en clave del padre (banco) 
     */
    async getAll(structureId?: string | number): Promise<BackendDraw[]> {
        log.debug('[getAll] Solicitud de obtención de sorteos', { structureId });
        
        if (structureId !== undefined && structureId !== null) {
            // 1. Buscar en clave del hijo (estructura específica)
            const userKey = DrawOfflineKeys.drawList(structureId);
            const userList = await offlineStorage.get<BackendDraw[]>(userKey);
            
            if (userList && userList.length > 0) {
                log.debug('[getAll] Cache HIT en estructura específica', { structureId, count: userList.length });
                return userList;
            }
            
            // 2. Buscar en clave del banco (padre) - inferido de draws guardados previamente
            // Usamos query().keys() del StoragePort
            try {
                const pattern = DrawOfflineKeys.getPattern('instance', 'list*', 'data');
                const queryResult = offlineStorage.query<BackendDraw[]>(pattern);
                const allListKeys = await queryResult.keys();
                
                for (const key of allListKeys) {
                    if (key === userKey) continue; // Ya buscamos esto
                    const bankList = await offlineStorage.get<BackendDraw[]>(key);
                    if (bankList && bankList.length > 0) {
                        log.info('[getAll] Cache HIT en estructura padre (banco)', { 
                            structureId, 
                            bankKey: key, 
                            count: bankList.length 
                        });
                        return bankList;
                    }
                }
            } catch (keysError) {
                log.warn('[getAll] No se pudieron obtener claves de lista', { error: keysError.message });
            }
            
            // 3. FALLBACK: buscar sorteos individuales SIN filtrar por estructura
            // Cuando no hay cache específico, retornamos todos los sorteos individuales
            // porque el hijo (estructura 43) hereda los sorteos del padre (banco 32)
            log.debug('[getAll] Cache MISS - Buscando sorteos individuales (sin filtro)', { structureId });
            const patternInd = DrawOfflineKeys.getPattern('instance', '*', 'data');
            const allIndividualDraws = await offlineStorage.query<BackendDraw>(patternInd).all();
            
            if (allIndividualDraws.length > 0) {
                log.info('[getAll] Cache HIT individual (herencia de banco)', { structureId, count: allIndividualDraws.length });
                return allIndividualDraws;
            }
            
            log.debug('[getAll] No se encontraron sorteos', { structureId });
            return [];
        }
        
        // Sin structureId - fallback global
        const globalKey = DrawOfflineKeys.drawList();
        const globalList = await offlineStorage.get<BackendDraw[]>(globalKey);
        
        if (globalList) {
            log.debug('[getAll] Cache HIT global', { count: globalList.length });
            return globalList;
        }
        
        log.warn('[getAll] Fallback global DENEGADO');
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
     * Obtiene los tipos de apuesta cacheados, incluyendo datos expirados.
     * Útil como fallback cuando la red falla y no hay cache fresco.
     * @returns Array de bet types o null si no hay cache (ni fresco ni expirado)
     */
    async getBetTypesIncludingStale(drawId: string | number): Promise<BetType[] | null> {
        const key = DrawOfflineKeys.betType(String(drawId), 'list');
        return await offlineStorage.getIncludingStale<BetType[]>(key);
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
