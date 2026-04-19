import { BetTypeWithRewardsResponse } from '@/shared/services/draw/types';
import { offlineStorage } from '@core/offline-storage/instance';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('RewardOfflineAdapter');

// Constantes de storage
const STORAGE_PREFIX = 'reward';
const VERSION = 'v1';

// TTL: 1 hora (los premios cambian poco, backend tiene 30 min cache)
const REWARD_TTL_MS = 60 * 60 * 1000;

export class RewardOfflineAdapter {
  /**
   * Genera la clave de almacenamiento para los betTypes con rewards.
   */
  private getKey(structureId?: number): string {
    if (structureId) {
      return `${STORAGE_PREFIX}:${VERSION}:structure:${structureId}`;
    }
    return `${STORAGE_PREFIX}:${VERSION}:default`;
  }

  /**
   * Guarda los betTypes con premios en caché.
   */
  async saveBetTypesWithRewards(
    data: BetTypeWithRewardsResponse,
    structureId?: number
  ): Promise<void> {
    const key = this.getKey(structureId);
    
    if (!offlineStorage) {
      log.error('[saveBetTypesWithRewards] offlineStorage no inicializado');
      return;
    }

    log.debug('[saveBetTypesWithRewards] Guardando en caché', {
      structureId,
      key,
      drawTypesCount: data.draw_types?.length,
      bankName: data.bank_name
    });

    try {
      await offlineStorage.set(key, data, { ttl: REWARD_TTL_MS });
      log.info('[saveBetTypesWithRewards] Guardado exitosamente', {
        structureId,
        drawTypesCount: data.draw_types?.length
      });
    } catch (error: any) {
      log.error('[saveBetTypesWithRewards] Error al guardar', {
        structureId,
        error: error?.message
      });
      throw error;
    }
  }

  /**
   * Obtiene los betTypes con premios desde caché.
   */
  async getBetTypesWithRewards(structureId?: number): Promise<BetTypeWithRewardsResponse | null> {
    const key = this.getKey(structureId);
    
    if (!offlineStorage) {
      log.error('[getBetTypesWithRewards] offlineStorage no inicializado');
      return null;
    }

    log.debug('[getBetTypesWithRewards] Obteniendo desde caché', { structureId, key });

    try {
      const data = await offlineStorage.get<BetTypeWithRewardsResponse>(key);
      
      if (data) {
        log.info('[getBetTypesWithRewards] Cache HIT', {
          structureId,
          drawTypesCount: data.draw_types?.length
        });
        return data;
      }

      log.debug('[getBetTypesWithRewards] Cache MISS', { structureId });
      return null;
    } catch (error: any) {
      log.error('[getBetTypesWithRewards] Error al obtener', {
        structureId,
        error: error?.message
      });
      return null;
    }
  }

  /**
   * Verifica si hay datos en caché.
   */
  async hasCached(structureId?: number): Promise<boolean> {
    const data = await this.getBetTypesWithRewards(structureId);
    return data !== null;
  }

  /**
   * Limpia la caché de rewards.
   */
  async clear(structureId?: number): Promise<void> {
    const key = this.getKey(structureId);
    log.debug('[clear] Limpiando caché', { key });

    try {
      await offlineStorage.remove(key);
      log.info('[clear] Caché limpiada', { key });
    } catch (error: any) {
      log.error('[clear] Error al limpiar', { key, error: error?.message });
    }
  }

  /**
   * Limpia toda la caché de rewards.
   */
  async clearAll(): Promise<void> {
    const pattern = `${STORAGE_PREFIX}:${VERSION}:*`;
    log.debug('[clearAll] Limpiando toda la caché de rewards', { pattern });

    try {
      await offlineStorage.clear(pattern);
      log.info('[clearAll] Toda la caché de rewards limpiada');
    } catch (error: any) {
      log.error('[clearAll] Error al limpiar', { error: error?.message });
    }
  }
}