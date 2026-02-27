import { KernelManifest, ModuleManifest } from '@/shared/core/architecture/manifest';
import { restDataProvider } from '@/shared/core/architecture/adapters';
import { gameResetAuthProvider } from '@/features/auth/adapters/auth_provider';
import { RoleBasedStrategy } from '@/shared/core/architecture/navigation';
import { AppRoots } from './routes';

/**
 * Root Module Manifest
 * 
 * Represents the entry point of the application module tree.
 * It imports feature-specific modules like Listero.
 */
const RootModule: ModuleManifest = {
    name: 'GameResetApp',
    imports: [
        // ListeroModule is now loaded dynamically via ListeroFeatureProvider
    ],
    registries: [],
    features: []
};

/**
 * Application Kernel Manifest
 * 
 * Declarative configuration for the entire application.
 * Used by the bootstrap process to initialize the kernel.
 */
export const AppManifest: KernelManifest = {
    root: RootModule,
    adapters: {
        dataProvider: restDataProvider,
        authProvider: gameResetAuthProvider,
        navigationStrategy: new RoleBasedStrategy(AppRoots),

    }
};
