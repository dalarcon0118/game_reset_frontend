import { Plugin, PluginContext, SlotComponentMetadata } from './plugin.types';
import { pluginEventBus } from './plugin.event_bus';
import apiClient from '../../services/api_client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FinancialSummaryService } from '../../services/financial_summary';
import { logger } from '../../utils/logger';

/**
 * PluginManager (Inspirado en el Bundle Manager de Eclipse).
 * Orquestra el ciclo de vida de los plugins y la inyección de contexto.
 */
class PluginManager {
    private plugins: Map<string, { plugin: Plugin, context: PluginContext }> = new Map();

    /**
     * Registra e inicializa un nuevo plugin.
     */
    register(plugin: Plugin, hostState?: Partial<PluginContext['state']>): void {
        if (!plugin) {
            logger.error('[PluginManager] Se intentó registrar un plugin undefined o null', 'PLUGINS');
            return;
        }

        if (!plugin.id) {
            logger.error(`[PluginManager] El plugin "${plugin.name || 'Sin Nombre'}" no tiene un ID válido`, 'PLUGINS');
            return;
        }

        if (this.plugins.has(plugin.id)) {
            logger.warn(`[PluginManager] Plugin "${plugin.id}" ya está registrado. Reiniciando...`, 'PLUGINS');
            this.unregister(plugin.id);
        }

        const context = this.createContext(plugin.id, hostState);

        try {
            if (plugin.init) {
                plugin.init(context);
            }
            this.plugins.set(plugin.id, { plugin, context });
            logger.info(`[PluginManager] Plugin inicializado: ${plugin.name} (${plugin.id})`, 'PLUGINS');
        } catch (error) {
            logger.error(`[PluginManager] Error inicializando plugin "${plugin.id}":`, 'PLUGINS', error);
        }
    }

    /**
     * Crea un contexto seguro y aislado para el plugin.
     */
    private createContext(pluginId: string, hostState?: Partial<PluginContext['state']>): PluginContext {
        return {
            api: {
                get: (endpoint) => apiClient.get(endpoint),
                post: (endpoint, body) => apiClient.post(endpoint, body),
                FinancialSummaryService: {
                    get: (structureId: string | number, date?: string) => FinancialSummaryService.get(structureId, date)
                }
            },
            storage: {
                getItem: async (key) => {
                    const val = await AsyncStorage.getItem(`plugin:${pluginId}:${key}`);
                    return val ? JSON.parse(val) : null;
                },
                setItem: async (key, value) => {
                    await AsyncStorage.setItem(`plugin:${pluginId}:${key}`, JSON.stringify(value));
                }
            },
            events: pluginEventBus,
            state: {
                user: hostState?.user || null,
                isOnline: hostState?.isOnline ?? true,
                theme: hostState?.theme || {},
            }
        };
    }

    /**
     * Obtiene componentes para un Slot, ordenados por metadatos.
     */
    getExtensionsForSlot(slotName: string): {
        id: string,
        component: React.ComponentType<any>,
        layout?: SlotComponentMetadata,
        context: PluginContext
    }[] {
        const extensions: any[] = [];

        this.plugins.forEach(({ plugin, context }) => {
            const slotConfig = plugin.slots[slotName];
            if (slotConfig) {
                extensions.push({
                    id: plugin.id,
                    component: slotConfig.component,
                    layout: slotConfig.layout,
                    context
                });
            }
        });

        // Ordenar por el campo 'order' (menor a mayor)
        return extensions.sort((a, b) => (a.layout?.order || 99) - (b.layout?.order || 99));
    }

    /**
     * Desregistra y limpia un plugin.
     */
    unregister(pluginId: string): void {
        const entry = this.plugins.get(pluginId);
        if (entry && entry.plugin.destroy) {
            try {
                entry.plugin.destroy();
            } catch (error) {
                console.error(`[PluginManager] Error destruyendo plugin "${pluginId}":`, error);
            }
        }
        this.plugins.delete(pluginId);
    }

    getAllPlugins(): Plugin[] {
        return Array.from(this.plugins.values()).map(e => e.plugin);
    }
}

export const pluginManager = new PluginManager();
export const pluginRegistry = pluginManager; // Alias para compatibilidad parcial
