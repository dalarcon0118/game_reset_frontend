/**
 * Repositories Module - Auto-registration via Service Locator
 *
 * Este módulo registra todos los repositorios en el locator bajo demanda.
 * El bootstrap solo necesita importar este archivo y llamar a RepositoriesModule.init()
 *
 * @example
 * // En bootstrap.ts
 * import { RepositoriesModule } from '@repositories';
 * RepositoriesModule.init();
 */

import { locator } from '@core/utils/locator';

// ============================================================================
// Tipos de interfaces de repositorios
// ============================================================================

import type { IBetRepository } from './bet/bet.types';
import type { IAuthRepository } from './auth/auth.ports';
import type { INotificationRepository } from './notification/notification.ports';
import type { StructurePorts } from './structure/structure.ports';
import type { IDlqRepository } from './dlq/dlq.ports';
import type { IWinningRepository } from './winning/winning.ports';
import type { IRulesRepository } from './rules/rules.ports';
import type { IIncidentRepository } from './incident/incident.ports';
import type { IValidationRuleRepository } from './validation_rule/validation_rule.ports';
import type { IRewardRuleRepository } from './reward_rule/reward_rule.ports';
import type { IDeviceRepository } from './system/device/device.ports';
import type { ITelemetryRepository } from './system/telemetry/telemetry.ports';
import type { IMaintenanceRepository } from './system/maintenance/maintenance.repository';
import type { FinancialRepository } from './financial/ledger.repository';
import type { IPromotionRepository } from './promotion/promotion.repository';
import type { ITimeRepository } from './system/time';
import type { FingerprintRepository } from './crypto/fingerprint.repository';

// ============================================================================
// Registro de repositorios
// ============================================================================

const registerRepositories = () => {

    // ─────────────────────────────────────────────────────────────────────────
    // TimerRepository — Singleton pre-creado (DEBE IR PRIMERO, ES DEPENDENCIA BASICA)
    // ─────────────────────────────────────────────────────────────────────────
    const { TimerRepository } = require('./system/time');
    locator.registerSingleton<ITimeRepository>('TimerRepository', TimerRepository);

  // ─────────────────────────────────────────────────────────────────────────
  // BetRepository — Singleton pre-creado en bet/bet.repository.ts
  // ─────────────────────────────────────────────────────────────────────────
  const { betRepository } = require('./bet/bet.repository');
  locator.registerSingleton<IBetRepository>('BetRepository', betRepository);

    // ─────────────────────────────────────────────────────────────────────────
    // AuthRepository — Singleton pre-creado en auth/index.ts
    // ─────────────────────────────────────────────────────────────────────────
    const { AuthRepository } = require('./auth');
    locator.registerSingleton<IAuthRepository>('AuthRepository', AuthRepository);

    // ─────────────────────────────────────────────────────────────────────────
    // NotificationRepository — Singleton pre-creado
    // ─────────────────────────────────────────────────────────────────────────
    const { notificationRepository } = require('./notification');
    locator.registerSingleton<INotificationRepository>('NotificationRepository', notificationRepository);

    // ─────────────────────────────────────────────────────────────────────────
    // DrawRepository — Singleton pre-creado
    // ─────────────────────────────────────────────────────────────────────────
    const { drawRepository } = require('./draw');
    locator.registerSingleton<any>('DrawRepository', drawRepository);

    // ─────────────────────────────────────────────────────────────────────────
    // DLQ Repository — Singleton pre-creado
    // ─────────────────────────────────────────────────────────────────────────
    const { dlqRepository } = require('./dlq');
    locator.registerSingleton<IDlqRepository>('DlqRepository', dlqRepository);

    // ─────────────────────────────────────────────────────────────────────────
    // StructureRepository — Singleton pre-creado
    // ─────────────────────────────────────────────────────────────────────────
    const { structureRepository } = require('./structure');
    locator.registerSingleton<StructurePorts>('StructureRepository', structureRepository);

    // ─────────────────────────────────────────────────────────────────────────
    // ValidationRuleRepository — Singleton pre-creado
    // ─────────────────────────────────────────────────────────────────────────
    const { ValidationRuleRepository } = require('./validation_rule');
    locator.registerSingleton<IValidationRuleRepository>('ValidationRuleRepository', ValidationRuleRepository);

    // ─────────────────────────────────────────────────────────────────────────
    // RulesRepository — Singleton pre-creado
    // ─────────────────────────────────────────────────────────────────────────
    const { rulesRepository } = require('./rules');
    locator.registerSingleton<IRulesRepository>('RulesRepository', rulesRepository);

    // ─────────────────────────────────────────────────────────────────────────
    // IncidentRepository — Singleton pre-creado
    // ─────────────────────────────────────────────────────────────────────────
    const { incidentRepository } = require('./incident');
    locator.registerSingleton<IIncidentRepository>('IncidentRepository', incidentRepository);

    // ─────────────────────────────────────────────────────────────────────────
    // WinningRepository — Singleton pre-creado
    // ─────────────────────────────────────────────────────────────────────────
    const { winningRepository } = require('./winning');
    locator.registerSingleton<IWinningRepository>('WinningRepository', winningRepository);

    // ─────────────────────────────────────────────────────────────────────────
    // RewardRuleRepository — Singleton pre-creado
    // ─────────────────────────────────────────────────────────────────────────
    const { rewardRuleRepository } = require('./reward_rule');
    locator.registerSingleton<IRewardRuleRepository>('RewardRuleRepository', rewardRuleRepository);

    // ─────────────────────────────────────────────────────────────────────────
    // PromotionRepository — Singleton pre-creado
    // ─────────────────────────────────────────────────────────────────────────
    const { promotionRepository } = require('./promotion/promotion.repository');
    locator.registerSingleton<IPromotionRepository>('PromotionRepository', promotionRepository);

    // ─────────────────────────────────────────────────────────────────────────
    // DeviceRepository — Singleton pre-creado
    // ─────────────────────────────────────────────────────────────────────────
    const { deviceRepository } = require('./system/device');
    locator.registerSingleton<IDeviceRepository>('DeviceRepository', deviceRepository);

    // ─────────────────────────────────────────────────────────────────────────
    // MaintenanceRepository — Singleton pre-creado
    // ─────────────────────────────────────────────────────────────────────────
    const { maintenanceRepository } = require('./system/maintenance/maintenance.repository');
    locator.registerSingleton<IMaintenanceRepository>('MaintenanceRepository', maintenanceRepository);

    // ─────────────────────────────────────────────────────────────────────────
    // TelemetryRepository — Singleton pre-creado
    // ─────────────────────────────────────────────────────────────────────────
    const { telemetryRepository } = require('./system/telemetry');
    locator.registerSingleton<ITelemetryRepository>('TelemetryRepository', telemetryRepository);

    // ─────────────────────────────────────────────────────────────────────────
    // FinancialRepository — Singleton pre-creado
    // ─────────────────────────────────────────────────────────────────────────
    const { financialRepository } = require('./financial');
    locator.registerSingleton<FinancialRepository>('FinancialRepository', financialRepository);

    // ─────────────────────────────────────────────────────────────────────────
    // FingerprintRepository — Clase con métodos estáticos
    // ─────────────────────────────────────────────────────────────────────────
    const { FingerprintRepository } = require('./crypto/fingerprint.repository');
    locator.registerSingleton<typeof FingerprintRepository>('FingerprintRepository', FingerprintRepository);
};

// ============================================================================
// RepositoriesModule - API Pública
// ============================================================================

export const RepositoriesModule = {
    init: () => {
        console.log('📦 Initializing Repositories Module...');
        registerRepositories();
        console.log('✅ Repositories registered in locator');
    },

    get: <T>(id: string): Promise<T> => locator.get<T>(id),

    getSync: <T>(id: string): T => locator.getSync<T>(id),

    has: (id: string): boolean => locator.has(id),
};

// ============================================================================
// Re-exports de interfaces para consumers
// ============================================================================

export type { IBetRepository } from './bet/bet.types';
export type { IAuthRepository } from './auth/auth.ports';
export type { INotificationRepository } from './notification/notification.ports';
export type { StructurePorts } from './structure/structure.ports';
export type { IDlqRepository } from './dlq/dlq.ports';
export type { IWinningRepository } from './winning/winning.ports';
export type { IRulesRepository } from './rules/rules.ports';
export type { IIncidentRepository } from './incident/incident.ports';
export type { IValidationRuleRepository } from './validation_rule/validation_rule.ports';
export type { IRewardRuleRepository } from './reward_rule/reward_rule.ports';
export type { IDeviceRepository } from './system/device/device.ports';
export type { ITelemetryRepository } from './system/telemetry/telemetry.ports';
export type { IMaintenanceRepository } from './system/maintenance/maintenance.repository';
export type { FinancialRepository } from './financial/ledger.repository';
export type { IPromotionRepository } from './promotion/promotion.repository';
export type { ITimeRepository } from './system/time';
