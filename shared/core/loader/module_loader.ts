import { ModuleManifest, RegistryGroup } from '../architecture/manifest';
import { logger } from '../../utils/logger';
import { FeatureLoader } from './feature_loader';
import { PluginManager } from '../plugins/plugin.registry';
import { FeatureRegistry } from '../architecture/feature_registry';

const getItemKey = <T>(item: T, getKey?: (item: T) => string): string => {
    if (getKey) {
        return getKey(item);
    }
    // Try common property names
    if ((item as any).id) return (item as any).id;
    if ((item as any).key) return (item as any).key;
    if ((item as any).name) return (item as any).name;

    throw new Error(`Cannot determine key for registry item. Provide a getKey function.`);
};

/**
 * ModuleLoader
 * 
 * Centralized utility to load full modules (Features, Plugins, Registries, Extensions).
 * Handles dependency resolution and prevents duplicate loading.
 */
export class ModuleLoader {
    private static loadedModules = new Set<string>();

    /**
     * Loads a module and all its dependencies recursively.
     * Idempotent: safe to call multiple times for the same module.
     */
    static async loadModule(manifest: ModuleManifest): Promise<void> {
        if (this.loadedModules.has(manifest.name)) {
            logger.debug(`Module ${manifest.name} already loaded, skipping.`, 'MODULE_LOADER');
            return;
        }

        logger.info(`Loading module: ${manifest.name}`, 'MODULE_LOADER');

        try {
            // 1. Load imported modules first (depth-first)
            if (manifest.imports) {
                await Promise.all(manifest.imports.map(m => this.loadModule(m)));
            }

            // 2. Load Registries
            this.loadRegistries(manifest);

            // 3. Load Features
            await this.loadFeatures(manifest);

            // 4. Load Plugins
            this.loadPlugins(manifest);

            // 5. Load Extensions
            this.loadExtensions(manifest);

            // Mark as loaded ONLY after successful execution
            this.loadedModules.add(manifest.name);
            logger.info(`Module ${manifest.name} loaded successfully`, 'MODULE_LOADER');

        } catch (error) {
            logger.error(`Failed to load module ${manifest.name}`, 'MODULE_LOADER', error);
            throw error;
        }
    }

    /**
     * Checks if a module has been fully loaded.
     */
    static isModuleLoaded(moduleName: string): boolean {
        return this.loadedModules.has(moduleName);
    }

    // --- Internal Helpers (Extracted from bootstrap_kernel.ts) ---

    private static loadRegistries(manifest: ModuleManifest) {
        if (manifest.registries) {
            manifest.registries.forEach((group: RegistryGroup<any>) => {
                logger.debug(`Loading registry group: ${group.name} in module ${manifest.name}`, 'MODULE_LOADER');
                group.items.forEach(item => {
                    try {
                        const key = getItemKey(item, group.getKey);
                        group.registry.register(key, item);
                    } catch (error) {
                        logger.error(`Failed to register item in ${group.name}`, 'MODULE_LOADER', error);
                        throw error;
                    }
                });
            });
        }
    }

    private static async loadFeatures(manifest: ModuleManifest) {
        if (manifest.features) {
            try {
                logger.debug(`Loading features for module ${manifest.name}`, 'MODULE_LOADER');
                await FeatureLoader.loadFeatures(manifest.features);
            } catch (error) {
                logger.error(`Failed to load features for module ${manifest.name}`, 'MODULE_LOADER', error);
                throw error;
            }
        }
    }

    private static loadPlugins(manifest: ModuleManifest) {
        if (manifest.plugins) {
            logger.debug(`Loading plugins for module ${manifest.name}`, 'MODULE_LOADER');
            manifest.plugins.forEach(p => {
                try {
                    // Register plugin with optional state and hostStore
                    PluginManager.register(p.plugin, p.state || p.hostStore?.getState(), p.hostStore);
                } catch (error) {
                    logger.error(`Failed to register plugin ${p.plugin.id}`, 'MODULE_LOADER', error);
                    throw error;
                }
            });
        }
    }

    private static loadExtensions(manifest: ModuleManifest) {
        if (manifest.extensions) {
            logger.debug(`Loading extensions for module ${manifest.name}`, 'MODULE_LOADER');
            manifest.extensions.forEach(ext => {
                try {
                    const isEnabled = typeof ext.enabled === 'function' ? ext.enabled() : (ext.enabled ?? true);

                    if (isEnabled) {
                        // If adapter exists, wrap the factory
                        const factory = ext.adapter
                            ? async () => ext.adapter!(await ext.factory())
                            : ext.factory;

                        FeatureRegistry.registerExtension(ext.slot, factory);
                    }
                } catch (error) {
                    logger.error(`Failed to register extension for slot ${ext.slot}`, 'MODULE_LOADER', error);
                    throw error;
                }
            });
        }
    }
}
