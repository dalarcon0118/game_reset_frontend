import {
    Plugin,
    PluginContext,
    SlotComponentMetadata
} from './plugin.types';
import { AppKernel } from '../architecture/kernel';
import { logger } from '../../utils/logger';
import { pluginEventBus } from './plugin.event_bus';
import storageClient from '@core/offline-storage/storage_client';
import { Registry } from '../utils/registry';

const log = logger.withTag('PLUGIN_REGISTRY');

interface RegisteredPlugin {
    plugin: Plugin;
    context: PluginContext;
}

class PluginManagerRegistry {
    private registry = new Registry<RegisteredPlugin>('PLUGIN_REGISTRY');
    private hostStore: any = null;

    /**
     * Registra un nuevo plugin en el sistema.
     */
    register(plugin: Plugin, hostState?: any, hostStore?: any): void {
        // DEFENSIVE: Always update hostStore reference if provided
        // This ensures we have the latest store instance even if plugins were registered before
        if (hostStore) {
            this.hostStore = hostStore;
        }

        if (this.registry.has(plugin.id)) {
            log.warn(`Plugin ${plugin.id} is already registered. Updating context references.`);

            // DEFENSIVE: Update existing plugin context with latest store/state
            // This fixes the issue where plugins kept stale references after navigation/reload
            const registered = this.registry.get(plugin.id)!;
            if (hostStore) {
                registered.context.hostStore = hostStore;
            }
            if (hostState) {
                registered.context.state = hostState;
            }
            return;
        }

        const context = this.createContext(plugin.id, hostState);

        try {
            // Inicializar el plugin si tiene método init
            if (plugin.init) {
                // Remove invalid properties from context before passing to init
                // The PluginContext type does not have 'id' or 'logger'
                plugin.init(context);
            }

            this.registry.register(plugin.id, { plugin, context });

            // Notificar que se ha registrado un plugin (para reactividad de Slots)
            pluginEventBus.publish('sys:plugin_registered', { pluginId: plugin.id });

            log.info(`Plugin ${plugin.id} registered successfully.`);
        } catch (error) {
            log.error(`Failed to initialize plugin ${plugin.id}`, error);
        }
    }

    /**
     * Unregisters a plugin from the system.
     * This is crucial for memory cleanup and avoiding stale references.
     * 
     * @param pluginId The ID of the plugin to unregister
     */
    unregister(pluginId: string): void {
        if (!this.registry.has(pluginId)) {
            return;
        }

        try {
            const entry = this.registry.get(pluginId);

            // Clean up plugin if it has a cleanup method
            if (entry?.plugin.cleanup) {
                entry.plugin.cleanup(entry.context);
            }

            this.registry.unregister(pluginId);

            // Notify about unregistration
            pluginEventBus.publish('sys:plugin_unregistered', { pluginId });

            log.info(`Plugin ${pluginId} unregistered successfully.`);
        } catch (error) {
            log.error(`Failed to unregister plugin ${pluginId}`, error);
        }
    }

    /**
     * Obtiene todas las extensiones (componentes) registradas para un Slot específico.
     * Retorna los componentes ordenados por prioridad.
     */
    getExtensionsForSlot(slotName: string): any[] {
        const extensions: {
            id: string;
            component: React.ComponentType<any>;
            layout?: SlotComponentMetadata;
            context: PluginContext;
        }[] = [];

        // Iterar sobre todos los plugins registrados
        const allPlugins = this.registry.getAll();

        allPlugins.forEach((entry) => {
            const { plugin, context } = entry;

            // Verificar si el plugin tiene slots y si tiene el slot específico que buscamos
            if (plugin.slots && plugin.slots[slotName]) {
                const slotConfig = plugin.slots[slotName];
                extensions.push({
                    id: plugin.id,
                    component: slotConfig.component,
                    layout: slotConfig.layout,
                    context: context
                });
            }
        });

        // Ordenar por prioridad (menor número = antes)
        return extensions.sort((a, b) => {
            const orderA = a.layout?.order ?? 999;
            const orderB = b.layout?.order ?? 999;
            return orderA - orderB;
        });
    }

    /**
     * Crea el contexto aislado para un plugin.
     */
    private createContext(pluginId: string, hostState?: any): PluginContext {
        return {
            // API Layer (usando AppKernel/DataProvider)
            api: {
                get: (endpoint: string) => {
                    if (!AppKernel.dataProvider) {
                        const error = new Error(`Plugin API Error: AppKernel.dataProvider is not initialized when calling GET ${endpoint}`);
                        log.error('Failed to access AppKernel.dataProvider. Ensure architecture is bootstrapped.', error);
                        throw error;
                    }
                    try {
                        return AppKernel.dataProvider.getList(endpoint, {});
                    } catch (e) {
                        log.error(`Failed to execute GET ${endpoint}`, e);
                        throw e;
                    }
                },
                post: (endpoint: string, body: any) => {
                    if (!AppKernel.dataProvider) {
                        const error = new Error(`Plugin API Error: AppKernel.dataProvider is not initialized when calling POST ${endpoint}`);
                        log.error('Failed to access AppKernel.dataProvider. Ensure architecture is bootstrapped.', error);
                        throw error;
                    }
                    try {
                        return AppKernel.dataProvider.create(endpoint, body);
                    } catch (e) {
                        log.error(`Failed to execute POST ${endpoint}`, e);
                        throw e;
                    }
                },
                ...new Proxy({}, {
                    get: (_, prop) => {
                        if (prop === 'get') return (endpoint: string) => {
                            if (!AppKernel.dataProvider) {
                                const error = new Error(`Plugin API Error: AppKernel.dataProvider is not initialized when calling GET ${endpoint} via Proxy`);
                                log.error('Failed to access AppKernel.dataProvider. Ensure architecture is bootstrapped.', error);
                                throw error;
                            }
                            try {
                                return AppKernel.dataProvider.getList(endpoint, {});
                            } catch (e) {
                                log.error(`Failed to execute GET ${endpoint} via Proxy`, e);
                                throw e;
                            }
                        };
                        if (prop === 'post') return (endpoint: string, body: any) => {
                            if (!AppKernel.dataProvider) {
                                const error = new Error(`Plugin API Error: AppKernel.dataProvider is not initialized when calling POST ${endpoint} via Proxy`);
                                log.error('Failed to access AppKernel.dataProvider. Ensure architecture is bootstrapped.', error);
                                throw error;
                            }
                            try {
                                return AppKernel.dataProvider.create(endpoint, body);
                            } catch (e) {
                                log.error(`Failed to execute POST ${endpoint} via Proxy`, e);
                                throw e;
                            }
                        };
                        return undefined;
                    }
                })
            } as any,

            // Storage Layer (Namespaced)
            storage: {
                getItem: (key: string) => storageClient.get(`plugin:${pluginId}:${key}`),
                setItem: (key: string, value: any) => storageClient.set(`plugin:${pluginId}:${key}`, value)
            },

            // Event Bus
            events: pluginEventBus,

            // Host State (Read-only access to some global state)
            state: hostState || {},

            // Host Store for subscriptions
            hostStore: this.hostStore
        };
    }

    getPlugin(id: string) {
        return this.registry.get(id);
    }

    getAllPlugins() {
        return this.registry.getAll().map(p => p.plugin);
    }
}

export const PluginManager = new PluginManagerRegistry();
// Alias for compatibility with components using lowercase import
export const pluginManager = PluginManager;
