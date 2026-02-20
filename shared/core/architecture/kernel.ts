
import { DataProvider, AuthProvider, NotificationProvider, ResourceDefinition, Feature, Plugin, NavigationStrategy } from './interfaces';
import { logger } from '../../utils/logger';
import { SubDescriptor } from '../sub';

/**
 * Default fallback strategy if none is provided
 */
class DefaultNavigationStrategy implements NavigationStrategy {
    getHomeRoute(user: any): string { return '/'; }
    canAccess(user: any, path: string): boolean { return true; }
    getBackPath(user: any, path: string): string | null { return null; }
}

/**
 * Handler para suscripciones kernel que permite extender la arquitectura sin contaminar el engine
 */
export interface SubscriptionHandler<Msg = any> {
    id: string;
    createSubscription: (params: any) => SubDescriptor<Msg>;
}

/**
 * AppKernel
 * 
 * Acts as the central registry for the application's architectural dependencies.
 * Similar to the <Refine> component, but accessible statically for TEA Engine.
 */
class AppKernelRegistry {
    private static instance: AppKernelRegistry;

    private _dataProvider?: DataProvider;
    private _authProvider?: AuthProvider;
    private _notificationProvider?: NotificationProvider;
    private _navigationStrategy: NavigationStrategy = new DefaultNavigationStrategy();
    private _resources: Map<string, ResourceDefinition> = new Map();

    // Registry for Modular Architecture
    private _features: Map<string, Feature> = new Map();
    private _plugins: Map<string, Plugin> = new Map();
    private _subscriptionHandlers: Map<string, SubscriptionHandler> = new Map();

    private constructor() { }

    static getInstance(): AppKernelRegistry {
        if (!AppKernelRegistry.instance) {
            AppKernelRegistry.instance = new AppKernelRegistry();
        }
        return AppKernelRegistry.instance;
    }

    /**
     * Configuration method to wire up the application
     */
    configure(config: {
        dataProvider: DataProvider;
        authProvider?: AuthProvider;
        notificationProvider?: NotificationProvider;
        navigationStrategy?: NavigationStrategy;
        resources?: ResourceDefinition[];
    }) {
        this._dataProvider = config.dataProvider;
        this._authProvider = config.authProvider;
        this._notificationProvider = config.notificationProvider;
        if (config.navigationStrategy) {
            this._navigationStrategy = config.navigationStrategy;
        }

        if (config.resources) {
            config.resources.forEach(res => {
                this._resources.set(res.name, res);
            });
        }

        logger.info('AppKernel configured successfully', 'KERNEL');
    }

    get dataProvider(): DataProvider {
        if (!this._dataProvider) {
            throw new Error('DataProvider not configured in AppKernel');
        }
        return this._dataProvider;
    }

    get authProvider(): AuthProvider {
        if (!this._authProvider) {
            throw new Error('AuthProvider not configured in AppKernel');
        }
        return this._authProvider;
    }

    get notificationProvider(): NotificationProvider {
        if (!this._notificationProvider) {
            throw new Error('NotificationProvider not configured in AppKernel');
        }
        return this._notificationProvider;
    }

    get navigationStrategy(): NavigationStrategy {
        return this._navigationStrategy;
    }

    getResource(name: string): ResourceDefinition | undefined {
        return this._resources.get(name);
    }


    /**
     * Registers a modular Feature into the Kernel.
     * Supports both simple features and adapted features.
     * 
     * @param feature The feature module to register
     * @param config Optional configuration object to pass to the feature's configure method
     */
    registerFeature(feature: Feature, config?: any) {
        if (this._features.has(feature.id)) {
            logger.warn(`Feature ${feature.id} already registered. Overwriting.`, 'KERNEL');
        }

        // 1. Dependency Injection / Configuration Phase
        if (feature.configure && config) {
            try {
                feature.configure(config);
                logger.debug(`Feature ${feature.id} configured successfully`, 'KERNEL');
            } catch (e) {
                logger.error(`Failed to configure feature ${feature.id}`, 'KERNEL', e);
                throw e; // Fail fast if configuration fails
            }
        } else if (feature.configure && !config) {
            logger.warn(`Feature ${feature.id} has a configure method but no config was provided`, 'KERNEL');
        }

        // 2. Registration Phase
        this._features.set(feature.id, feature);
        logger.info(`Feature registered: ${feature.id}`, 'KERNEL');
    }

    /**
     * Registers a global Plugin (Middleware).
     */
    registerPlugin(plugin: Plugin) {
        this._plugins.set(plugin.id, plugin);
        if (plugin.onInit) {
            plugin.onInit();
        }
        logger.info(`Plugin registered: ${plugin.id}`, 'KERNEL');
    }

    /**
     * Retrieves a registered feature by ID.
     */
    getFeature(id: string): Feature | undefined {
        return this._features.get(id);
    }

    /**
     * Retrieves all registered plugins.
     */
    getPlugins(): Plugin[] {
        return Array.from(this._plugins.values());
    }

    /**
     * Registers a subscription handler that can be used by features
     */
    registerSubscriptionHandler(handler: SubscriptionHandler) {
        this._subscriptionHandlers.set(handler.id, handler);
        logger.info(`Subscription handler registered: ${handler.id}`, 'KERNEL');
    }

    /**
     * Gets a registered subscription handler by ID
     */
    getSubscriptionHandler(id: string): SubscriptionHandler | undefined {
        return this._subscriptionHandlers.get(id);
    }

    /**
     * Gets all registered subscription handlers
     */
    getSubscriptionHandlers(): Map<string, SubscriptionHandler> {
        return this._subscriptionHandlers;
    }

    /**
     * Resolves the correct update function for a given message.
     * This implements the "Level of Updates" logic.
     * 
     * @param msg The global message
     * @returns An object containing the bound update function and the target feature ID, or null if not handled.
     */
    resolveUpdate(msg: any): { update: (state: any) => any, featureId: string } | null {
        // 1. Check features with adapters (Priority/Complex)
        for (const feature of this._features.values()) {
            if (feature.adapter) {
                const innerMsg = feature.adapter.lower(msg);
                if (innerMsg) {
                    return {
                        update: (state: any) => feature.update(innerMsg, state),
                        featureId: feature.id
                    };
                }
            }
        }

        // 2. Check simple features (Convention: msg.type starts with feature.id)
        if (msg.type && typeof msg.type === 'string') {
            const parts = msg.type.split('.');
            const featureId = parts[0];

            const feature = this._features.get(featureId);
            if (feature && !feature.adapter) {
                return {
                    update: (state: any) => feature.update(msg, state),
                    featureId: feature.id
                };
            }
        }

        return null;
    }

    isReady(): boolean {
        return !!this._dataProvider;
    }
}

export const AppKernel = AppKernelRegistry.getInstance();
