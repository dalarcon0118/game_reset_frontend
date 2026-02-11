import { pluginManager } from './plugin.registry';
import { DebugPlugin } from './debug_plugin';
import { SummaryPluginExport as SummaryPlugin } from '@/features/listero/dashboard/plugins/summary_plugin';
import { FiltersPlugin } from '@/features/listero/dashboard/plugins/filters_plugin';
import { DrawsListPlugin } from '@/features/listero/dashboard/plugins/draws_list_plugin';

/**
 * Inicializa todos los plugins del sistema.
 * Este método debe llamarse al arrancar la aplicación.
 */
export const initPlugins = (hostState?: any) => {
    console.log('[Plugins] Inicializando sistema de plugins...');

    // Registrar Plugins
    // pluginManager.register(DebugPlugin, hostState);
    pluginManager.register(SummaryPlugin, hostState);
    pluginManager.register(FiltersPlugin, hostState);
    pluginManager.register(DrawsListPlugin, hostState);

    console.log('[Plugins] Sistema de plugins listo.');
};

// Re-exportar elementos clave para facilitar el uso
export * from './plugin.types';
export * from './plugin.registry';
export * from './plugin.event_bus';
export * from './Slot';
