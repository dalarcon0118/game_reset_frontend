
import { useEffect } from 'react';
import { CoreModule } from '../shared/core/core_module';

/**
 * Hook para disparar la inicialización del CoreModule.
 * Debe usarse dentro de un componente que esté envuelto por CoreModule.Provider.
 */
export function useCoreBootstrap() {
  const dispatch = CoreModule.useDispatch();
  const status = CoreModule.useStore(s => s.model.bootstrapStatus);
  const error = CoreModule.useStore(s => s.model.error);

  useEffect(() => {
    if (status === 'IDLE') {
      dispatch({ type: 'BOOTSTRAP_STARTED' });
    }
  }, [status, dispatch]);

  return {
    bootstrapped: status === 'READY',
    initializing: status === 'INITIALIZING',
    error
  };
}
