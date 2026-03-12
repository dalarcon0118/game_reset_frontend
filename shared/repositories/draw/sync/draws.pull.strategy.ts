import { 
    SyncStrategy 
} from '@core/offline-storage/types';
import { DrawApi } from '../api/api';
import { DrawOfflineAdapter } from '../adapters/draw.offline.adapter';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('DRAW_SYNC_STRATEGY');

/**
 * Estrategia de sincronización PULL para Sorteos.
 * Se encarga de traer sorteos actualizados del servidor al caché local.
 */
export class DrawsPullStrategy implements SyncStrategy {
    private api = DrawApi;
    private offline = new DrawOfflineAdapter();

    async pull(): Promise<void> {
        try {
            log.info('Pulling updated draws from server...');
            
            // 1. Obtener de API
            const draws = await this.api.list({ next24h: true });
            
            // 2. Persistir localmente
            if (draws.length > 0) {
                await this.offline.saveDraws(draws);
                log.info(`Synced ${draws.length} draws successfully.`);
            } else {
                log.debug('No draws returned from server.');
            }

        } catch (error) {
            log.error('Error pulling draws for sync', error);
            // No lanzamos error para que el worker no falle si falla un pull opcional
        }
    }
}
