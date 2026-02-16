import { pluginManager } from './plugin.registry';
import { DebugPlugin } from './debug_plugin';
import { default as OfflineSyncPlugin, OFFLINE_SYNC_ENABLED } from '@/features/listero/dashboard/plugins/offline_sync_plugin';
import FinancialIntegrityPlugin from '@/features/listero/dashboard/plugins/financial_integrity_plugin';
import SummaryPlugin from '@/features/listero/dashboard/plugins/summary_plugin';
import { FiltersPlugin } from '@/features/listero/dashboard/plugins/filters_plugin';
import { DrawsListPlugin } from '@/features/listero/dashboard/plugins/draws_list_plugin';

import { logger } from '../../utils/logger';

const log = logger.withTag('PLUGINS_INIT');

/**
 * Inicializa todos los plugins del sistema.
 * Este método debe llamarse al arrancar la aplicación.
 */
export const initPlugins = (hostState?: any, hostStore?: any) => {
    log.info('Initializing plugin system...');

    // Registrar Plugins Visuales del Dashboard
    log.info('Registering Dashboard Visual Plugins...');
    pluginManager.register(SummaryPlugin, hostState);
    pluginManager.register(FiltersPlugin, hostState);
    pluginManager.register(DrawsListPlugin, hostState);

    // Registrar FinancialIntegrityPlugin
    log.info('Registering FinancialIntegrityPlugin...');
    pluginManager.register(FinancialIntegrityPlugin);

    // Registrar OfflineSyncPlugin condicionalmente
    // Puede desactivarse cambiando OFFLINE_SYNC_ENABLED a false
    if (OFFLINE_SYNC_ENABLED) {
        log.info('Registering OfflineSyncPlugin...');
        pluginManager.register(OfflineSyncPlugin, hostState);
    } else {
        log.warn('OfflineSyncPlugin disabled (OFFLINE_SYNC_ENABLED = false)');
    }

    log.info('Plugin system ready.');
};

// Re-exportar elementos clave para facilitar el uso
export * from './plugin.types';
export * from './plugin.registry';
export * from './plugin.event_bus';
export * from './Slot';
