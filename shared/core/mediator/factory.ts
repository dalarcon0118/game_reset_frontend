/**
 * Mediator Factory - Creates TeaMediator instances with Resolver pattern
 * 
 * Improved version with:
 * - onRegister receives full context (storeId, messageTypes)
 * - Integrated dispatch through TEA engine
 * - Proper routing with originStoreId
 */

import { Cmd } from '../tea-utils/cmd';
import { logger } from '../../utils/logger';
import {
    TeaResolver,
    TeaMediator,
    MsgWithCorrelation,
    ResponseType,
    MediatorConfig,
    StoreRegistration,
    ResolverContext,
    MediatorSendPayload,
    MediatorReplyPayload
} from './types';

const log = logger.withTag('MEDIATOR');

/**
 * Generate a unique correlation ID
 */
const generateCorrelationId = (): string => {
    return `corr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
};

/**
 * Creates a TeaMediator instance
 * 
 * @param name - Name for debugging
 * @param resolver - Callbacks to connect with TEA stores
 * @param config - Optional configuration
 */
export const createMediator = <Store = any>(
    name: string,
    resolver?: TeaResolver<Store>,
    config: MediatorConfig = {}
): TeaMediator<Store> => {
    const {
        debug = __DEV__
    } = config;

    // Store factories (lazy creation)
    const factories = new Map<string, () => Store>();

    // Active store instances
    const instances = new Map<string, Store>();

    // Message types this mediator can handle
    const msgTypes = new Set<string>();

    // Track which store handles which message type
    const messageHandlers = new Map<string, string>();

    // Track correlation IDs to origin stores
    const correlationToOrigin = new Map<string, string>();

    // Global dispatch - set via init()
    let globalDispatch: ((msg: any) => void) | null = null;

    const mediator: TeaMediator<Store> = {
        name,

        init(dispatch: (msg: any) => void) {
            globalDispatch = dispatch;

            // Initialize resolver with context
            if (resolver?.init) {
                resolver.init({
                    dispatch: (msg) => {
                        if (debug) {
                            log.debug(`[${name}] Resolver dispatch:`, msg);
                        }
                        dispatch(msg);
                    },
                    getStore: (id) => mediator.get(id)
                });
            }

            if (debug) {
                log.debug(`[${name}] Mediator initialized with dispatch`, 'MEDIATOR');
            }
        },

        register(
            storeId: string,
            factory: () => Store,
            messageTypes: string[]
        ) {
            if (factories.has(storeId)) {
                log.warn(`Store "${storeId}" already registered in ${name}, overwriting`, 'MEDIATOR');
            }

            factories.set(storeId, factory);

            // Create instance
            const store = factory();
            instances.set(storeId, store);

            // Register message types -> store mapping
            messageTypes.forEach(msgType => {
                messageHandlers.set(msgType, storeId);
                msgTypes.add(msgType);
            });

            // Call resolver with FULL registration info
            if (resolver?.onRegister) {
                resolver.onRegister({
                    storeId,
                    store,
                    messageTypes
                });
            }

            if (debug) {
                log.debug(
                    `[${name}] Store registered: ${storeId}, handlers: ${messageTypes.join(', ')}`,
                    'MEDIATOR'
                );
            }
        },

        registerMsg(types: { type: string }[]) {
            types.forEach(t => {
                msgTypes.add(t.type);
            });

            if (debug) {
                log.debug(`[${name}] Registered message types: ${types.map(t => t.type).join(', ')}`, 'MEDIATOR');
            }
        },

        canHandle(msg: { type: string }): boolean {
            return msgTypes.has(msg.type);
        },

        has(storeId: string): boolean {
            return factories.has(storeId);
        },

        get(storeId: string): Store | null {
            if (!instances.has(storeId) && factories.has(storeId)) {
                const factory = factories.get(storeId);
                if (factory) {
                    instances.set(storeId, factory());
                }
            }
            return instances.get(storeId) || null;
        },

        keys(): string[] {
            return Array.from(factories.keys());
        },

        handledMsgTypes(): string[] {
            return Array.from(msgTypes);
        },

        send(
            msg: MsgWithCorrelation,
            responseType: ResponseType,
            originStoreId?: string
        ): Cmd {
            // Generate correlation ID if not present
            const correlationId = msg.correlationId || generateCorrelationId();

            // Build message with correlation info
            const msgWithCorrelation: MsgWithCorrelation = {
                ...msg,
                correlationId,
                replyTo: responseType.type,
                originStoreId: originStoreId,
            };

            // Track origin for response routing
            if (originStoreId) {
                correlationToOrigin.set(correlationId, originStoreId);
            }

            if (debug) {
                log.debug(
                    `[${name}] Sending: ${msg.type} -> ${responseType.type} (correlation: ${correlationId})`,
                    'MEDIATOR'
                );
            }

            // Use resolver to find the appropriate store
            const targetStore = resolver?.onSend?.(msgWithCorrelation) || null;

            if (!targetStore) {
                // Fallback: find by message type
                const storeId = messageHandlers.get(msg.type);
                if (storeId) {
                    const store = instances.get(storeId);
                    if (store) {
                        // Dispatch directly to the store
                        dispatchToStore(store, msgWithCorrelation);
                    }
                }
            } else {
                // Dispatch to resolver's target store
                dispatchToStore(targetStore, msgWithCorrelation);
            }

            // Return command for TEA engine execution
            return {
                type: 'MEDIATOR_SEND',
                payload: {
                    mediatorName: name,
                    msg: msgWithCorrelation,
                    correlationId,
                    responseType: responseType.type,
                    originStoreId,
                } as MediatorSendPayload
            };
        },

        sendReply(response: MsgWithCorrelation): Cmd {
            const correlationId = response.responseTo || response.correlationId;

            if (!correlationId) {
                log.warn(`[${name}] sendReply called without correlationId`, 'MEDIATOR');
                return Cmd.none;
            }

            if (debug) {
                log.debug(`[${name}] Replying to: ${correlationId}`, 'MEDIATOR');
            }

            // Find origin store
            const originStoreId = correlationToOrigin.get(correlationId);

            // Use resolver to find the origin store
            const originStore = resolver?.onReply?.(response) ||
                (originStoreId ? instances.get(originStoreId) : null);

            if (originStore) {
                dispatchToStore(originStore, response);
            } else if (debug) {
                log.warn(`[${name}] No origin store found for correlation: ${correlationId}`, 'MEDIATOR');
            }

            // Clean up correlation tracking
            correlationToOrigin.delete(correlationId);

            return {
                type: 'MEDIATOR_REPLY',
                payload: {
                    mediatorName: name,
                    response,
                    correlationId,
                } as MediatorReplyPayload
            };
        },

        destroy() {
            if (debug) {
                log.debug(`[${name}] Destroying mediator`, 'MEDIATOR');
            }

            // Clear all tracking
            correlationToOrigin.clear();
            instances.clear();
            factories.clear();
            messageHandlers.clear();
            msgTypes.clear();
            globalDispatch = null;
        }
    };

    /**
     * Helper: dispatch message to TEA store
     */
    const dispatchToStore = (store: Store, msg: MsgWithCorrelation) => {
        const storeAny = store as any;

        // Try different dispatch methods
        if (storeAny.dispatch) {
            storeAny.dispatch(msg);
        } else if (typeof store === 'function') {
            // It's a TEA store function
            try {
                const state = (store as any).getState?.();
                if (state?.dispatch) {
                    state.dispatch(msg);
                }
            } catch (e) {
                // Not a valid TEA store function
            }
        } else if (storeAny.getState?.()?.dispatch) {
            storeAny.getState().dispatch(msg);
        } else if (globalDispatch) {
            // Fallback to global dispatch
            globalDispatch(msg);
        }

        if (debug) {
            log.debug(`[${name}] Dispatched to store:`, msg.type, 'MEDIATOR');
        }
    };

    return mediator;
};

/**
 * Create a global mediator registry
 * This allows multiple mediators to be managed together
 */
export const createMediatorRegistry = () => {
    const mediators = new Map<string, TeaMediator>();

    return {
        register(mediator: TeaMediator) {
            if (mediators.has(mediator.name)) {
                log.warn(`Mediator "${mediator.name}" already registered`, 'MEDIATOR');
            }
            mediators.set(mediator.name, mediator);
        },

        get(name: string): TeaMediator | undefined {
            return mediators.get(name);
        },

        has(name: string): boolean {
            return mediators.has(name);
        },

        /** Find which mediator can handle a message type */
        findMediatorForMsg(msgType: string): TeaMediator | undefined {
            for (const [, mediator] of mediators) {
                if (mediator.canHandle({ type: msgType })) {
                    return mediator;
                }
            }
            return undefined;
        },

        destroyAll() {
            mediators.forEach(m => m.destroy());
            mediators.clear();
        }
    };
};
