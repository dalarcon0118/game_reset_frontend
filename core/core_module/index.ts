
import { createTEAModule } from '@core/engine/tea_module';
import { initialModel, CoreModel } from './model';
import { CoreMsg } from './msg';
import { update } from './update';
import { subscriptions } from './subscriptions';

/**
 * CoreModule
 * Orquestador global de la aplicación (Kernel + Infraestructura).
 * Centraliza la inicialización declarativa a través de la función update.
 */
export const CoreModule = createTEAModule<CoreModel, CoreMsg>({
  name: 'Core',
  initial: initialModel,
  update,
  subscriptions,
});

export * from './model';
export * from './msg';
export * from './update';
export * from './subscriptions';
