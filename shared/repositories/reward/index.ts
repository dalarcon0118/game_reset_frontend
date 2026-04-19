import { IRewardRepository } from './reward.ports';
import { RewardRepository } from './reward.repository';

export * from './reward.ports';
export * from './reward.repository';

/**
 * Instancia única del repositorio de premios (Singleton)
 * Sigue el patrón Repository con Inyección de Dependencias.
 */
export const rewardRepository = new RewardRepository();