import { createElmStore } from '@/shared/core/engine/engine';
import { effectHandlers } from '@/shared/core/tea-utils/effect_handlers';
import { initialModel, Model } from './model';
import { update } from './update';
import { subscriptions } from './subscriptions';
import { Msg } from './msg';
import { Cmd } from '@/shared/core';
import { createLoggerMiddleware } from '@/shared/core/middlewares/logger.middleware';
// 1. Declarar variable local nula
let dashboardStoreInstance: ReturnType<typeof createElmStore<Model, Msg>> | null = null;
// 2. Crear una función getter
export const getDashboardStore = () => {
  if (!dashboardStoreInstance) {
    // En este punto, estamos seguros de que la app ya terminó de cargar
    // todos los imports y ejecutó las configuraciones globales.
    dashboardStoreInstance = createElmStore<Model, Msg>(
      () => [initialModel(), Cmd.none],
      update,
      effectHandlers,
      subscriptions,
      [createLoggerMiddleware()]
    );
  }
  return dashboardStoreInstance;
};
// 3. Crear un hook personalizado para React
export const useDrawsListPluginStore = <T>(selector?: (state: { model: Model; dispatch: (msg: Msg) => void; init: (params?: any) => void }) => T): T => {
  const store = getDashboardStore();
  // @ts-ignore - Zustand selector type matching
  return selector ? store(selector) : store();
};

export const selectModel = (state: { model: Model }) => state.model;
export const selectDispatch = (state: { dispatch: (msg: Msg) => void }) => state.dispatch;
export const selectInit = (state: { init: (params?: any) => void }) => state.init;
