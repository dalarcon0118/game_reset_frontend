
import { DataProvider, AuthProvider, NotificationProvider, ResourceDefinition, Feature, Plugin, NavigationStrategy } from './interfaces';
import { logger } from '../../utils/logger';
import { SubDescriptor } from '../tea-utils/sub';
import { Registry } from '../utils/registry';

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

    // Registry for Modular Architecture
    private _resources = new Registry<ResourceDefinition>('KERNEL_RESOURCES');
    private _features = new Registry<Feature>('KERNEL_FEATURES');
    private _plugins = new Registry<Plugin>('KERNEL_PLUGINS');
    private _subscriptionHandlers = new Registry<SubscriptionHandler>('KERNEL_SUBSCRIPTIONS');

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
                this._resources.register(res.name, res);
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
        // 1. Dependency Injection / Configuration Phase
        if (feature.configure) {
            try {
                // Call configure even if config is undefined, to support parameterless setup
                feature.configure(config);
                logger.debug(`Feature ${feature.id} configured successfully`, 'KERNEL');
            } catch (e) {
                logger.error(`Failed to configure feature ${feature.id}`, 'KERNEL', e);
                // We don't throw here to allow partial failures in configuration if needed,
                // or we should throw if it's critical. The original code threw.
                throw e;
            }
        }

        // 2. Registration Phase
        this._features.register(feature.id, feature, true); // true = overwrite allowed as per original warning
    }

    /**
     * Registers a global Plugin (Middleware).
     */
    registerPlugin(plugin: Plugin) {
        this._plugins.register(plugin.id, plugin);
        if (plugin.onInit) {
            plugin.onInit();
        }
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
        return this._plugins.getAll();
    }

    /**
     * Registers a subscription handler that can be used by features
     */
    registerSubscriptionHandler(handler: SubscriptionHandler) {
        this._subscriptionHandlers.register(handler.id, handler);
        logger.info(`[KERNEL] Subscription handler registered: ${handler.id}`, 'KERNEL');
    }

    /**
     * Gets a registered subscription handler by ID
     */
    getSubscriptionHandler(id: string): SubscriptionHandler | undefined {
        const handler = this._subscriptionHandlers.get(id);
        if (!handler) {
            logger.warn(`[KERNEL] Subscription handler not found: ${id}. Available: ${this._subscriptionHandlers.getIds().join(', ')}`, 'KERNEL');
        }
        return handler;
    }

    /**
     * Gets all registered subscription handlers
     */
    getSubscriptionHandlers(): SubscriptionHandler[] {
        return this._subscriptionHandlers.getAll();
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
        for (const feature of this._features.getAll()) {
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
