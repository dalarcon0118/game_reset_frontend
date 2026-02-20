import { Model } from './model';
import { Sub } from '@/shared/core/sub';
import { SYNC_STATE, BATCH_OFFLINE_UPDATE } from './msg';
import { OfflineFinancialService } from '@/shared/services/offline';
import { logger } from '@/shared/utils/logger';
import { extractHostState, createDrawsHash, HostStatePayload } from './host.adapter';
import { calculateOfflineUpdates } from './offline.calculator';

const log = logger.withTag('DRAWS_LIST_PLUGIN_SUBS');

let lastDrawsHash: string | null = null;
let lastPayload: HostStatePayload | null = null;

export const subscriptions = (model: Model) => {
  // Validación de entradas: Asegurar que el contexto y hostStore existen antes de suscribirse
  if (!model.context) {
    log.debug('Subscription skipped: No context');
    return Sub.none();
  }

  if (!model.context.hostStore) {
    log.warn('Subscription skipped: Context exists but hostStore is missing', {
      contextKeys: Object.keys(model.context)
    });
    return Sub.none();
  }

  return Sub.batch([
    // Suscripción principal al host store
    Sub.watchStore(
      model.context.hostStore,
      (state: any) => {
        // Use adapter to extract and validate state
        const currentPayload = extractHostState(state, model.config);

        // Calculate hash for change detection
        const currentHash = createDrawsHash(
          currentPayload.draws,
          currentPayload.filter,
          currentPayload.summary,
          currentPayload.pendingBets.length,
          currentPayload.syncedBets.length
        );

        log.debug('Host Store Update Check', {
          drawsState: currentPayload.draws.type,
          hasData: currentPayload.draws.type === 'Success',
          currentHash,
          lastHash: lastDrawsHash,
          isEqual: currentHash === lastDrawsHash
        });

        // Si el hash es el mismo que el último procesado, retornamos el último payload
        // para que la comparación por referencia en el engine detenga la propagación.
        if (currentHash === lastDrawsHash && lastPayload) {
          return lastPayload;
        }

        log.info('Syncing Plugin State', {
          drawsState: currentPayload.draws.type,
          drawsCount: currentPayload.draws.type === 'Success' ? currentPayload.draws.data.length : 0
        });

        lastDrawsHash = currentHash;
        lastPayload = currentPayload;
        return currentPayload;
      },
      (payload) => SYNC_STATE(payload),
      'draws-list-plugin-sync'
    ),
    // Fase 4: Suscripción a cambios offline
    Sub.custom(
      (dispatch: (msg: any) => void) => {
        // 1. Ejecución inicial inmediata para cargar datos tras reinicio
        const updateOfflineStates = async () => {
          try {
            const pendingBets = await OfflineFinancialService.getPendingBets();

            // Use pure calculator logic
            const updates = calculateOfflineUpdates(pendingBets as any[]);

            // Siempre enviamos el dispatch (incluso si está vacío) para asegurar que el estado inicial sea correcto
            dispatch(BATCH_OFFLINE_UPDATE({ updates }));
          } catch (error) {
            log.error('Error updating offline states', error);
          }
        };

        // Ejecutar inmediatamente al suscribir
        updateOfflineStates();

        // 2. Suscribirse a cambios reales en el servicio para actualizaciones reactivas
        const unsubscribe = OfflineFinancialService.onAnyStateChange(() => {
          updateOfflineStates();
        });

        // 3. Mantener polling de seguridad (por si acaso fallan los eventos) pero más espaciado
        const intervalId = setInterval(updateOfflineStates, 10000);

        return () => {
          unsubscribe();
          clearInterval(intervalId);
        };
      },
      'draws-list-plugin-offline'
    ),
  ]);
};
