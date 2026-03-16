
// 1. Bootstrapping de Infraestructura (Side-effect)
import '../bootstrap';

import { createTEAModule } from '@core/engine/tea_module';
import { initialModel, CoreModel } from './model';
import { CoreMsg } from './msg';
import { update } from './update';
import { subscriptions } from './subscriptions';
import { RoleNavigationPolicy } from './policies/role_navigation.policy';

/**
 * CoreModule
 * Orquestador global de la aplicación (Kernel + Infraestructura).
 * Centraliza la inicialización declarativa a través de la función update.
 * Actúa como Composition Root inyectando las dependencias base.
 */
export const CoreModule = createTEAModule<CoreModel, CoreMsg>({
  name: 'Core',
  initial: {
    ...initialModel,
    navigationPolicy: RoleNavigationPolicy
  },
  update,
  subscriptions,
});

export * from './model';
export * from './msg';
export * from './update';
export * from './subscriptions';
