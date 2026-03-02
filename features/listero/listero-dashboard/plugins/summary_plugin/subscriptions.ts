import { Sub } from '@/shared/core/sub';
import { Model } from './model';
import { Msg, FETCH_FINANCIAL_SUMMARY } from './msg';
import { onLedgerChange } from '@/shared/repositories/financial/ledger.repository';

export const subscriptions = (model: Model) => {
  // Si no tenemos el contexto inicializado o no hay structureId, no podemos suscribirnos aún
  if (!model.context || !model.structureId) {
    return Sub.none();
  }

  return Sub.custom((dispatch) => {
    // Suscribirse a cambios en el Ledger local
    const unsubscribe = onLedgerChange(() => {
      // Cuando el Ledger cambie, disparamos una recarga de datos
      dispatch(FETCH_FINANCIAL_SUMMARY());
    });

    return unsubscribe;
  }, 'summary-ledger-watch');
};