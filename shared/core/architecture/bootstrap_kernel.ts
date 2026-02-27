import { AppKernel } from './kernel';
import { KernelManifest } from './manifest';
import { logger } from '../../utils/logger';
import { ModuleLoader } from '../loader/module_loader';

/**
 * Bootstraps the application kernel using a declarative manifest.
 */
export const bootstrapKernel = async (manifest: KernelManifest): Promise<void> => {
  logger.info('Bootstrapping Kernel...', 'BOOTSTRAP');

  try {
    // 1. Configure Adapters
    AppKernel.configure({
      dataProvider: manifest.adapters.dataProvider,
      authProvider: manifest.adapters.authProvider,
      navigationStrategy: manifest.adapters.navigationStrategy,
      resources: manifest.adapters.resources
    });

    // 2. Load Root Module (Recursively via ModuleLoader)
    await ModuleLoader.loadModule(manifest.root);

    logger.info('Kernel bootstrapped successfully', 'BOOTSTRAP');
  } catch (error) {
    logger.error('Kernel bootstrap failed', 'BOOTSTRAP', error);
    throw error;
  }
};
