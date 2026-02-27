
import { AppKernel } from '../architecture/kernel';
import { Feature, LazyFeature, FeatureImplementation } from '../architecture/interfaces';
import { logger } from '../../utils/logger';

/**
 * FeatureLoader
 * 
 * Utility to lazy-load features into the Kernel only when needed.
 * This prevents unnecessary memory usage and side-effects from unused features.
 * Supports both Legacy Features (synchronous) and Lazy Features (asynchronous/demand-loaded).
 */
export class FeatureLoader {
    /**
     * Registers a list of features into the Kernel if they are not already registered.
     * Supports both direct Feature instances and LazyFeature definitions.
     * 
     * @param features Array of Feature modules or LazyFeature definitions
     */
    static async loadFeatures(features: (Feature | LazyFeature)[]): Promise<void> {
        for (const feature of features) {
            // Skip if already loaded
            if (AppKernel.getFeature(feature.id)) {
                logger.debug(`Feature ${feature.id} already loaded, skipping.`, 'FEATURE_LOADER');
                continue;
            }

            logger.info(`Loading feature: ${feature.id}`, 'FEATURE_LOADER');

            try {
                // Check if it's a LazyFeature (has a load function)
                if ('load' in feature && typeof feature.load === 'function') {
                    // Execute the lazy loader
                    const loadedModule = await feature.load();

                    // The loaded module might be the FeatureImplementation directly or wrapped in default export
                    // We assume it returns an object that matches FeatureImplementation or Feature
                    const implementation = loadedModule as FeatureImplementation | Feature;

                    // Register with Kernel
                    // Note: AppKernel.registerFeature currently expects Feature interface
                    // We might need to adapt FeatureImplementation to Feature if they diverge significantly
                    // For now, we assume structural compatibility for registration
                    AppKernel.registerFeature({
                        ...implementation,
                        id: feature.id // Ensure ID is preserved from manifest
                    } as Feature);
                } else {
                    // It's a standard synchronous Feature
                    AppKernel.registerFeature(feature as Feature);
                }
            } catch (error) {
                logger.error(`Failed to load feature ${feature.id}`, 'FEATURE_LOADER', error);
                // We re-throw to allow the caller to handle critical failures
                throw error;
            }
        }
    }

    /**
     * Checks if a specific feature is loaded
     */
    static isFeatureLoaded(featureId: string): boolean {
        return !!AppKernel.getFeature(featureId);
    }
}
