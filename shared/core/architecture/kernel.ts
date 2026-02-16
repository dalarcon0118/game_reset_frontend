
import { DataProvider, AuthProvider, NotificationProvider, ResourceDefinition } from './interfaces';
import { logger } from '@/shared/utils/logger';

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
    private _resources: Map<string, ResourceDefinition> = new Map();
    
    private constructor() {}

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
        resources?: ResourceDefinition[];
    }) {
        this._dataProvider = config.dataProvider;
        this._authProvider = config.authProvider;
        this._notificationProvider = config.notificationProvider;
        
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

    getResource(name: string): ResourceDefinition | undefined {
        return this._resources.get(name);
    }
}

export const AppKernel = AppKernelRegistry.getInstance();
