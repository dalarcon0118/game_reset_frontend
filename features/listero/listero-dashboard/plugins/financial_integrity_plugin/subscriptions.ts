import { Sub, RemoteData } from '@/shared/core/tea-utils';
import { Model } from './model';
import { SYNC_DATA } from './msg';

export function subscriptions(model: Model): Sub<typeof SYNC_DATA> {
  if (!model.context) return Sub.none();

  // Usar hostStore para suscribirse a cambios del estado del host
  const hostStore = model.context.hostStore;
  if (!hostStore) {
    console.warn('[FinancialIntegrityPlugin] hostStore no disponible en el contexto');
    return Sub.none();
  }

  return Sub.batch([
    // Nos suscribimos a los cambios en el estado del host (Dashboard)
    // para reaccionar a nuevas apuestas o nuevos resúmenes del backend
    Sub.watchStore(
      hostStore,
      (state: any) => {
        const hostModel = state.model || state;
        const summary = hostModel.summary?.type === 'Success' ? hostModel.summary.data : null;
        const pendingBets = hostModel.pendingBets || [];
        const syncedBets = hostModel.syncedBets || [];
        const commissionRate = hostModel.commissionRate || 0.1;
        
        return {
          allLocalBets: [...pendingBets, ...syncedBets],
          backendSummary: summary,
          commissionRate
        };
      },
      (data) => SYNC_DATA(data),
      'financial-integrity-sync'
    )
  ]);
}
