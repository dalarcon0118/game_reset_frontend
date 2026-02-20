
import { AppKernel } from '../architecture/kernel';
import { Feature } from '../architecture/interfaces';
import { logger } from '../../utils/logger';

/**
 * FeatureLoader
 * 
 * Utility to lazy-load features into the Kernel only when needed.
 * This prevents unnecessary memory usage and side-effects from unused features.
 */
export class FeatureLoader {
    /**
     * Registers a list of features into the Kernel if they are not already registered.
     * 
     * @param features Array of Feature modules to register
     */
    static loadFeatures(features: Feature[]) {
        features.forEach(feature => {
            if (!AppKernel.getFeature(feature.id)) {
                logger.info(`Lazy loading feature: ${feature.id}`, 'FEATURE_LOADER');
                try {
                    AppKernel.registerFeature(feature);
                } catch (error) {
                    logger.error(`Failed to lazy load feature ${feature.id}`, 'FEATURE_LOADER', error);
                    // We might want to re-throw or handle this depending on criticality
                }
            } else {
                logger.debug(`Feature ${feature.id} already loaded, skipping.`, 'FEATURE_LOADER');
            }
        });
    }

    /**
     * Checks if a specific feature is loaded
     */
    static isFeatureLoaded(featureId: string): boolean {
        return !!AppKernel.getFeature(featureId);
    }
}
