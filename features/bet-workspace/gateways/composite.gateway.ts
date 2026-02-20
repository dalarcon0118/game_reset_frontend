import { Model } from '../model';
import { Msg } from '../core/msg';
import { ExternalFeaturesHandler } from './external.gateway';
import { Cmd } from '@/shared/core/cmd';

/**
 * Registry Gateway
 * Acts as a composite handler that delegates to multiple sub-feature handlers.
 * Implements the Composite Pattern.
 */
export class RegistryGateway implements ExternalFeaturesHandler<Msg, Model> {
    private handlers: ExternalFeaturesHandler[] = [];

    /**
     * Registers a new handler in the chain.
     */
    register(handler: ExternalFeaturesHandler) {
        this.handlers.push(handler);
        return this; // Fluid interface
    }

    receive(msg: Msg, model: Model): [Model, any] | null {
        for (const handler of this.handlers) {
            const result = handler.receive(msg, model);
            if (result) {
                return result;
            }
        }
        return null;
    }

    /**
     * Propagates emitted messages from sub-features to the kernel.
     * In this context, the RegistryGateway acts as a pass-through or aggregator.
     * However, features usually emit directly via their own injected gateways.
     * This method is provided to fulfill the interface contract.
     */
    emit(msg: any): any {
        // Here we could implement global event bus logic or simply return the message
        // wrapped in a Kernel Dispatch command if we had access to it.
        // For now, we return it as is, assuming the caller knows how to handle it.
        return msg;
    }

    subscriptions(model: Model): any | any[] {
        let allSubs: any[] = [];
        for (const handler of this.handlers) {
            if (handler.subscriptions) {
                const subs = handler.subscriptions(model);
                if (Array.isArray(subs)) {
                    allSubs = [...allSubs, ...subs];
                } else if (subs) {
                    allSubs.push(subs);
                }
            }
        }
        return allSubs;
    }
}

/**
 * Helper to create a handler from a Feature with an Adapter
 */
export const createFeatureHandler = (feature: any): ExternalFeaturesHandler => {
    // If the feature has a configure method, we inject a gateway that allows emitting
    if (feature.configure) {
        feature.configure({
            externalGateway: {
                receive: (msg: any, model: any) => {
                    // Internal loopback not implemented here
                    return null;
                },
                subscriptions: () => [],
                emit: (msg: any) => {
                    // When the feature emits, we lift it if possible
                    if (feature.adapter && feature.adapter.lift) {
                        const globalMsg = feature.adapter.lift(msg);
                        return Cmd.sleep(0, globalMsg);
                    }
                    return Cmd.sleep(0, msg);
                }
            }
        });
    }

    return {
        receive: (msg: Msg, model: Model) => {
            // Case 1: Feature has an explicit adapter
            if (feature.adapter) {
                const localMsg = feature.adapter.lower(msg);
                if (localMsg) {
                    return feature.update(localMsg, model);
                }
            }

            // Case 2: Feature uses ID-based routing (Convention over Configuration)
            if (feature.id && msg.type === feature.id && feature.update) {
                // Assuming the payload is the message for the feature
                // This supports the wrapped pattern { type: 'LOTERIA', payload: ... }
                // @ts-ignore - Dynamic dispatch
                return feature.update(msg.payload, model);
            }

            return null;
        },

        subscriptions: (model: Model) => {
            if (feature.subscriptions) {
                return feature.subscriptions(model);
            }
            return [];
        },

        emit: (msg: any) => {
            if (feature.adapter && feature.adapter.lift) {
                const globalMsg = feature.adapter.lift(msg);
                return Cmd.sleep(0, globalMsg);
            }
            return Cmd.sleep(0, msg);
        }
    };
};
