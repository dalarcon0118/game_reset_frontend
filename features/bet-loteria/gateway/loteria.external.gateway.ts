import { Model as GlobalModel } from '../../bet-workspace/model';
import { LoteriaMsg } from '@/features/bet-loteria/loteria.types';
import { logger } from '@/shared/utils/logger';
import { FeatureGateway } from '@/shared/core/architecture/interfaces';

const log = logger.withTag('LOTERIA_EXTERNAL_GATEWAY');

/**
 * Interface for the External Features Gateway implementation.
 * This allows the loteria feature to be decoupled from specific feature implementations.
 */
export interface LoteriaExternalFeaturesHandler extends FeatureGateway<LoteriaMsg, GlobalModel> { }

let implementation: LoteriaExternalFeaturesHandler | null = null;

/**
 * Loteria External Features Gateway
 * Acts as an Anti-Corruption Layer (ACL) between the Loteria feature and external domain features.
 * Now acts as a proxy to a registered implementation.
 */
export const LoteriaExternalFeaturesGateway = {
    /**
     * Registers the concrete implementation of the gateway.
     * Should be called at application bootstrap.
     */
    register: (handler: LoteriaExternalFeaturesHandler) => {
        implementation = handler;
        log.info('LoteriaExternalFeaturesGateway implementation registered');
    },

    /**
     * Routes external messages to their respective feature implementations.
     * Delegates to the registered implementation.
     * @param msg The message to route
     * @param model The current global model
     * @returns A Return tuple [Model, Cmd] or null if the message is not handled
     */
    receive: (msg: LoteriaMsg, model: GlobalModel): [GlobalModel, any] | null => {
        if (!implementation) {
            // Warn only once or debug to avoid spamming
            log.warn('LoteriaExternalFeaturesGateway: No implementation registered. External messages will be ignored.');
            return null;
        }
        return implementation.receive(msg, model);
    },

    /**
     * Configures subscriptions for external events.
     */
    subscriptions: (model: GlobalModel): any | any[] => {
        if (!implementation || !implementation.subscriptions) {
            return [];
        }
        return implementation.subscriptions(model);
    },

    // Legacy support
    handle: (msg: LoteriaMsg, model: GlobalModel): [GlobalModel, any] | null => {
        return LoteriaExternalFeaturesGateway.receive(msg, model);
    }
};