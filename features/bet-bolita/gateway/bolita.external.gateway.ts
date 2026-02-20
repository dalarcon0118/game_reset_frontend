import { Model as GlobalModel } from '../../bet-workspace/model';
import { BolitaMsg, BolitaOutMsg } from '@/features/bet-bolita/bolita.types';
import { logger } from '@/shared/utils/logger';
import { FeatureGateway } from '@/shared/core/architecture/interfaces';

const log = logger.withTag('BOLITA_EXTERNAL_GATEWAY');

/**
 * Interface for the External Features Gateway implementation.
 * This allows the bolita feature to be decoupled from specific feature implementations.
 */
export interface BolitaExternalFeaturesHandler extends FeatureGateway<BolitaMsg, GlobalModel> {
    emit?(msg: BolitaOutMsg): any;
}

let implementation: BolitaExternalFeaturesHandler | null = null;

/**
 * Bolita External Features Gateway
 * Acts as an Anti-Corruption Layer (ACL) between the Bolita feature and external domain features.
 * Now acts as a proxy to a registered implementation.
 */
export const BolitaExternalFeaturesGateway = {
    /**
     * Registers the concrete implementation of the gateway.
     * Should be called at application bootstrap.
     */
    register: (handler: BolitaExternalFeaturesHandler) => {
        implementation = handler;
        log.info('BolitaExternalFeaturesGateway implementation registered');
    },

    /**
     * Routes external messages to their respective feature implementations.
     * Delegates to the registered implementation.
     * @param msg The message to route
     * @param model The current global model
     * @returns A Return tuple [Model, Cmd] or null if the message is not handled
     */
    receive: (msg: BolitaMsg, model: GlobalModel): [GlobalModel, any] | null => {
        if (!implementation) {
            // Warn only once or debug to avoid spamming
            log.warn('BolitaExternalFeaturesGateway: No implementation registered. External messages will be ignored.');
            return null;
        }
        return implementation.receive(msg, model);
    },

    /**
     * Emits outbound messages from the Bolita feature to the external domain (Kernel).
     */
    emit: (msg: BolitaOutMsg): any => {
        if (!implementation || !implementation.emit) {
            log.warn('BolitaExternalFeaturesGateway: No implementation registered for emit.');
            return null;
        }
        return implementation.emit(msg);
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
    handle: (msg: BolitaMsg, model: GlobalModel): [GlobalModel, any] | null => {
        return BolitaExternalFeaturesGateway.receive(msg, model);
    }
};
