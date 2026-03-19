import { Cmd } from '@/shared/core';
import { IDrawRepository } from '@/shared/repositories/draw';
import { IWinningsRepository } from '@/shared/repositories/bet/winnings.repository';
import { IRulesRepository } from '@/shared/repositories/rules';

export { IDrawRepository, IWinningsRepository, IRulesRepository };

/**
 * 🛠️ DATA SERVICE ADAPTER (Data Service Contract)
 * Interfaz que define las operaciones de datos para el módulo de Rewards.
 * Sigue el patrón de Inyección de Dependencias.
 */
export interface IRewardsDataService {
    /** Obtiene los premios generales del sorteo */
    fetchDrawRewards(drawId: string): Cmd;

    /** Obtiene las reglas del sorteo */
    fetchDrawRules(drawId: string): Cmd;

    /** Obtiene las apuestas ganadoras del usuario para el sorteo */
    fetchUserWinnings(drawId: string): Cmd;
}

/**
 * 🎨 UI SERVICE ADAPTER (UI Service Contract)
 * Interfaz que define las operaciones de UI y navegación para el módulo de Rewards.
 */
export interface IRewardsUIService {
    /** Muestra una alerta de error */
    showError(message: string): void;

    /** Navega hacia atrás */
    goBack(): void;

    /** Loguea eventos de la UI */
    logEvent(name: string, params?: any): void;
}
