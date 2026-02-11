import { Model } from './model';
import { Sub } from '@/shared/core/sub';
import { SYNC_STATE } from './msg';
import { DRAW_FILTER, DrawCodec } from './core/types';
import { RemoteData } from '@/shared/core/remote.data';
import * as E from 'fp-ts/Either';
import * as t from 'io-ts';
import { PathReporter } from 'io-ts/PathReporter';

export const subscriptions = (model: Model) => {
  if (!model.context?.hostStore) {
    console.warn('[DrawsListPlugin] No hostStore found in context');
    return Sub.none();
  }

  console.log('[DrawsListPlugin] Setting up watchStore subscription');

  return Sub.batch([
    Sub.watchStore(
      model.context.hostStore,
      (state: any) => {
        // Intentar obtener el modelo del host de varias formas comunes
        const hostModel = state.model || state;

        const rawDraws = hostModel[model.config.drawsStateKey];
        const availableKeys = Object.keys(hostModel);

        console.log('[DrawsListPlugin] Syncing from host. Key:', model.config.drawsStateKey, 'Found:', !!rawDraws, 'Available keys:', availableKeys.slice(0, 10).join(', '));

        if (rawDraws) {
          console.log('[DrawsListPlugin] rawDraws type:', rawDraws.type, 'Data length:', rawDraws.data?.length);
        }

        // Validate draws with io-ts
        let validatedDraws = rawDraws;
        if (RemoteData.isSuccess(rawDraws)) {
          console.log('[DrawsListPlugin] Validating', rawDraws.data?.length, 'draws');
          if (rawDraws.data.length > 0) {
            console.log('[DrawsListPlugin] RAW DRAW SAMPLE:', JSON.stringify(rawDraws.data[0], null, 2));
          }
          const result = t.array(DrawCodec).decode(rawDraws.data);
          if (E.isLeft(result)) {
            const errors = PathReporter.report(result);
            console.error('[DrawsListPlugin] Validation FAILED for draws:', errors.join('\n'));
            validatedDraws = RemoteData.failure('Invalid draws data format from host: ' + errors.join(', '));
          } else {
            console.log('[DrawsListPlugin] Validation successful');
            validatedDraws = RemoteData.success(result.right);
          }
        }

        return {
          draws: validatedDraws,
          filter: hostModel.statusFilter || DRAW_FILTER.ALL
        };
      },
      (payload) => SYNC_STATE(payload),
      'draws-list-plugin-sync'
    )
  ]);
};
