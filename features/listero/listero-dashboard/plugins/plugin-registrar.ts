/**
 * Dashboard Plugins Index
 * 
 * Este archivo registra todos los plugins del dashboard en el PluginManager.
 * Debe importarse cuando se carga el dashboard para que los slots funcionen.
 */

import { PluginManager } from '@core/plugins/plugin.registry';
import { Plugin } from '@core/plugins/plugin.types';

// Importar todos los plugins del dashboard
import { DrawsListPlugin } from './draws_list_plugin';
import { FiltersPlugin } from './filters_plugin';
import { SummaryPluginExport as SummaryPlugin } from './summary_plugin';
import { resetSyncState as resetDrawsListSyncState } from './draws_list_plugin/subscriptions';
import { resetSyncState as resetSummarySyncState } from './summary_plugin/subscriptions';

// Lista de plugins a registrar
const dashboardPlugins: Plugin[] = [
    DrawsListPlugin,
    FiltersPlugin,
    SummaryPlugin,
];

let registered = false;

/**
 * Registra todos los plugins del dashboard en el PluginManager
 * Solo se ejecuta una vez (idempotente)
 * 
 * @param store El store del dashboard (Zustand)
 */
export function registerDashboardPlugins(store: any): void {
    if (registered || !store) {
        return;
    }

    // Resetear estados de sincronización de los plugins para que no hereden hashes de la sesión anterior
    resetDrawsListSyncState();
    resetSummarySyncState();

    const currentState = store.getState();

    dashboardPlugins.forEach((plugin) => {
        try {
            PluginManager.register(plugin, currentState, store);
        } catch (error) {
            console.error(`[DashboardPlugins] Failed to register plugin ${plugin.id}:`, error);
        }
    });

    registered = true;
}

/**
 * Desregistra todos los plugins del dashboard del PluginManager.
 * Esto es vital para liberar memoria cuando el usuario sale del dashboard.
 */
export function unregisterDashboardPlugins(): void {
    if (!registered) {
        return;
    }

    // También reseteamos al desregistrar para mayor seguridad
    resetDrawsListSyncState();
    resetSummarySyncState();

    dashboardPlugins.forEach((plugin) => {
        try {
            PluginManager.unregister(plugin.id);
        } catch (error) {
            console.error(`[DashboardPlugins] Failed to unregister plugin ${plugin.id}:`, error);
        }
    });

    registered = false;
}

export { DrawsListPlugin, FiltersPlugin, SummaryPlugin };
