
import { FeatureRegistry } from './feature_registry';
import { PluginManager } from '../plugins/plugin.registry';
import { FeatureLoader, LazyFeature } from '../loader/feature_loader';
import { logger } from '../../utils/logger';

const log = logger.withTag('SYSTEM_COMPOSER');

/**
 * Definition of an extension point (Feature A extends Feature B at Slot X)
 */
export interface AsyncExtensionDefinition {
    slot: string;
    /** Factory that returns the extension (feature or handler) */
    factory: () => Promise<any> | any;
    /** Optional adapter to transform the feature before injection */
    adapter?: (feature: any) => any;
    /** Conditional execution */
    enabled?: boolean | (() => boolean);
}

/**
 * Definition of a plugin registration
 */
export interface AsyncPluginDefinition {
    plugin: any;
    /** Optional initial state for the plugin */
    state?: any;
    /** Optional store reference */
    store?: any;
    /** Conditional execution */
    enabled?: boolean | (() => boolean);
}

/**
 * Definition of a background service
 */
export interface AsyncServiceDefinition {
    name: string;
    start: () => Promise<void> | void;
    stop: () => Promise<void> | void;
    enabled?: boolean | (() => boolean);
}

/**
 * Declarative System Manifest (Async)
 */
export interface AsyncSystemManifest {
    extensions?: AsyncExtensionDefinition[] | (() => Promise<AsyncExtensionDefinition[]>);
    plugins?: AsyncPluginDefinition[] | (() => Promise<AsyncPluginDefinition[]>);
    bootstrapFeatures?: LazyFeature[] | (() => Promise<LazyFeature[]>);
    services?: AsyncServiceDefinition[] | (() => Promise<AsyncServiceDefinition[]>);
}

// Re-export old types for backward compatibility if needed, or deprecate them
export type ExtensionDefinition = AsyncExtensionDefinition;
export type PluginDefinition = AsyncPluginDefinition;
export type SystemManifest = AsyncSystemManifest;

/**
 * System Composer
 * 
 * Orchestrates the composition of the system based on a declarative manifest.
 * Unifies Feature Composition (Extensions), Plugin Registration, and Service Lifecycle.
 */
export class SystemComposer {
    private static currentManifest: AsyncSystemManifest | null = null;

    /**
     * Executes the full system pipeline: Compose -> Bootstrap
     * 
     * @param manifestProvider A function that returns the system manifest
     */
    static async run(manifestProvider: () => Promise<AsyncSystemManifest>) {
        log.info('Starting system pipeline...');
        
        try {
            // Phase 1: Resolve Manifest & Compose (Extensions & Plugins)
            const manifest = await manifestProvider();
            this.currentManifest = manifest;
            await this.compose(manifest);
            
            // Phase 2: Bootstrap (Features & Services)
            await this.bootstrap(manifest);
            
            log.info('System pipeline completed successfully.');
        } catch (error) {
            log.error('System pipeline failed', error);
            throw error;
        }
    }

    /**
     * Phase 1: Composition
     * Registers extensions and plugins defined in the manifest.
     */
    private static async compose(manifest: AsyncSystemManifest) {
        log.info('Phase 1: Composing system...');

        // 1. Resolve & Register Extensions
        const extensions = typeof manifest.extensions === 'function' 
            ? await manifest.extensions() 
            : manifest.extensions || [];

        for (const ext of extensions) {
            if (!this.isEnabled(ext.enabled)) {
                log.debug(`Extension for ${ext.slot} skipped (disabled)`);
                continue;
            }

            FeatureRegistry.registerExtension(ext.slot, async () => {
                let instance = await ext.factory();
                if (ext.adapter) {
                    instance = ext.adapter(instance);
                }
                return instance;
            });
        }

        // 2. Resolve & Register Plugins
        const plugins = typeof manifest.plugins === 'function'
            ? await manifest.plugins()
            : manifest.plugins || [];

        for (const plug of plugins) {
            if (!this.isEnabled(plug.enabled)) {
                log.debug(`Plugin ${plug.plugin.id || 'unknown'} skipped (disabled)`);
                continue;
            }

            try {
                PluginManager.register(plug.plugin, plug.state, plug.store);
            } catch (error) {
                log.error(`Failed to register plugin ${plug.plugin.id}`, error);
            }
        }
    }

    /**
     * Phase 2: Bootstrap
     * Loads blocking features and starts background services.
     */
    private static async bootstrap(manifest: AsyncSystemManifest) {
        log.info('Phase 2: Bootstrapping system...');

        // 1. Resolve & Load Bootstrap Features
        const features = typeof manifest.bootstrapFeatures === 'function'
            ? await manifest.bootstrapFeatures()
            : manifest.bootstrapFeatures || [];

        if (features.length > 0) {
            log.debug(`Loading ${features.length} bootstrap features...`);
            await FeatureLoader.loadFeatures(features);
        }

        // 2. Resolve & Start Services
        const services = typeof manifest.services === 'function'
            ? await manifest.services()
            : manifest.services || [];

        for (const service of services) {
            if (this.isEnabled(service.enabled)) {
                log.info(`Starting service: ${service.name}`);
                try {
                    await service.start();
                } catch (error) {
                    log.error(`Failed to start service ${service.name}`, error);
                }
            } else {
                log.debug(`Service ${service.name} skipped (disabled)`);
            }
        }
    }

    /**
     * Teardown
     * Stops all running services and cleans up the system.
     */
    static async teardown() {
        if (!this.currentManifest) {
            log.warn('Teardown called but no manifest is active');
            return;
        }

        log.info('Tearing down system...');

        const services = typeof this.currentManifest.services === 'function'
            ? await this.currentManifest.services()
            : this.currentManifest.services || [];

        // Stop services in reverse order (optional, but often good practice)
        for (const service of services.reverse()) {
            if (this.isEnabled(service.enabled)) {
                log.info(`Stopping service: ${service.name}`);
                try {
                    await service.stop();
                } catch (error) {
                    log.error(`Failed to stop service ${service.name}`, error);
                }
            }
        }
        
        this.currentManifest = null;
        log.info('System teardown completed.');
    }

    /**
     * Helper to evaluate conditional flags
     */
    private static isEnabled(condition?: boolean | (() => boolean)): boolean {
        if (condition === undefined) return true;
        if (typeof condition === 'function') return condition();
        return condition;
    }
}
