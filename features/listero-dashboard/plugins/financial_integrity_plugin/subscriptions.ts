import { Sub } from '@/shared/core/sub';
import { Model } from './model';
import { SYNC_DATA } from './msg';
import { RemoteData } from '@/shared/core/remote.data';

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
    hostStore.subscribe((hostState: any) => {
      const summary = hostState.summary?.type === 'Success' ? hostState.summary.data : null;
      const pendingBets = hostState.pendingBets || [];
      const syncedBets = hostState.syncedBets || [];
      const commissionRate = hostState.commissionRate || 0.1;

      // Unimos todas las apuestas locales del día
      const allLocalBets = [...pendingBets, ...syncedBets];

      return SYNC_DATA({
        allLocalBets,
        backendSummary: summary,
        commissionRate
      });
    }, 'financial-integrity-sync')
  ]);
}
