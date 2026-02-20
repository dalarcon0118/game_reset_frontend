import { Model } from '../model';
import { Msg } from '../core/msg';
import { logger } from '@/shared/utils/logger';
import { FeatureGateway } from '@/shared/core/architecture/interfaces';

const log = logger.withTag('EXTERNAL_GATEWAY');

/**
 * Interface for the External Features Gateway implementation.
 * This allows the workspace to be decoupled from specific feature implementations.
 */
export interface ExternalFeaturesHandler<Msg = any, Model = any> extends FeatureGateway<Msg, Model> {
    emit?(msg: any): any;
}

let implementation: ExternalFeaturesHandler | null = null;

/**
 * External Features Gateway
 * Acts as an Anti-Corruption Layer (ACL) between the Workspace and external domain features.
 * Now acts as a proxy to a registered implementation.
 */
export const ExternalFeaturesGateway = {
    /**
     * Registers the concrete implementation of the gateway.
     * Should be called at application bootstrap.
     */
    register: (handler: ExternalFeaturesHandler) => {
        implementation = handler;
        log.info('ExternalFeaturesGateway implementation registered');
    },

    /**
     * Routes external messages to their respective feature implementations.
     * Delegates to the registered implementation.
     * @param msg The message to route
     * @param model The current global model
     * @returns A Return tuple [Model, Cmd] or null if the message is not handled
     */
    receive: (msg: Msg, model: Model): [Model, any] | null => {
        if (!implementation) {
            // Warn only once or debug to avoid spamming
            log.warn('ExternalFeaturesGateway: No implementation registered. External messages will be ignored.');
            return null;
        }
        return implementation.receive(msg, model);
    },

    /**
     * Emits outbound messages from the feature to the external domain (Kernel).
     */
    emit: (msg: any): any => {
        if (!implementation || !implementation.emit) {
            log.warn('ExternalFeaturesGateway: No implementation registered for emit.');
            return null;
        }
        return implementation.emit(msg);
    },

    /**
     * Configures subscriptions for external events.
     * @param model The current global model
     */
    subscriptions: (model: Model): any | any[] => {
        if (!implementation || !implementation.subscriptions) {
            return [];
        }
        return implementation.subscriptions(model);
    },

    // Legacy method support (deprecated)
    handle: (msg: Msg, model: Model): [Model, any] | null => {
        return ExternalFeaturesGateway.receive(msg, model);
    }
};
