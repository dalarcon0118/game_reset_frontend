import { logger } from '../../utils/logger';
import { Registry } from '../utils/registry';

type ExtensionFactory = () => any | Promise<any>;

/**
 * Feature Registry Service
 * 
 * Provides a declarative mechanism for composing features at runtime.
 * Allows "Parent" features to define extension slots, and "Child" features
 * to register themselves into those slots without direct coupling.
 * 
 * Implements the Inversion of Control pattern for Feature Composition.
 */
class FeatureRegistryService {
    // Stores pending extensions for slots that might not be active yet
    private slots = new Registry<ExtensionFactory[]>('EXTENSION_SLOTS');

    // Stores active gateways (parents) ready to receive extensions
    private activeGateways = new Registry<any>('EXTENSION_GATEWAYS');

    /**
     * Registers an extension (child feature) into a specific slot.
     * 
     * @param slotId The identifier of the extension point (e.g., 'workspace.games', 'dashboard.widgets')
     * @param factory A function that returns the feature instance, handler, or descriptor (sync or async)
     */
    registerExtension(slotId: string, factory: ExtensionFactory) {
        let extensions = this.slots.get(slotId);

        if (!extensions) {
            extensions = [];
            this.slots.register(slotId, extensions);
        }

        extensions.push(factory);
        logger.debug(`Extension registered for slot: ${slotId}`, 'FEATURE_REGISTRY');

        // If the parent gateway is already active, inject the extension immediately (Hot Wiring)
        if (this.activeGateways.has(slotId)) {
            // We pass the factory directly to injectExtension, not the whole array
            this.injectExtension(slotId, factory);
        }
    }

    /**
     * Called by a Parent Feature to claim a slot and receive extensions.
     * 
     * @param slotId The identifier of the extension point
     * @param gateway The gateway or registry object that accepts extensions via a .register() method
     */
    compose(slotId: string, gateway: any) {
        this.activeGateways.register(slotId, gateway, true); // Overwrite allowed for gateways (re-init)
        logger.info(`Slot activated: ${slotId}`, 'FEATURE_REGISTRY');

        // Inject all pending extensions
        const pendingExtensions = this.slots.get(slotId) || [];
        pendingExtensions.forEach(factory => {
            this.injectExtension(slotId, factory);
        });
    }

    private async injectExtension(slotId: string, factory: ExtensionFactory) {
        // Retrieve the gateway AGAIN to ensure we have the fresh instance
        // This is critical because compose() registers the gateway instance
        const gateway = this.activeGateways.get(slotId);

        if (gateway && typeof gateway.register === 'function') {
            try {
                // Support both synchronous and asynchronous factories
                // If factory returns a Promise, await it. If it returns a value, await wraps it automatically.
                const extension = await factory();
                gateway.register(extension);
                logger.debug(`Injected extension into ${slotId}`, 'FEATURE_REGISTRY');
            } catch (error) {
                logger.error(`Failed to inject extension into ${slotId}`, 'FEATURE_REGISTRY', error);
            }
        } else {
            // Only warn if we actually found a gateway but it was invalid
            if (gateway) {
                logger.warn(`Gateway for ${slotId} does not implement .register()`, 'FEATURE_REGISTRY');
            }
        }
    }
}

export const FeatureRegistry = new FeatureRegistryService();
