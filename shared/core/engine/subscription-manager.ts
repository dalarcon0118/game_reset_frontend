/**
 * Gestor de Suscripciones para el Motor TEA.
 * Maneja el ciclo de vida de todos los tipos de suscripciones.
 */

import { StoreApi } from 'zustand';
import { SubDescriptor } from '../tea-utils/sub';
import { isDeepEqual } from '../../utils/comparison';
import { logger } from '../../utils/logger';
import { globalEventRegistry } from '../tea-utils/events';
import { globalSignalBus } from '../tea-utils/signal_bus';
import { storeRegistry } from './store_registry';

const log = logger.withTag('SUBSCRIPTION_MANAGER');

/**
 * Tipos de suscripción soportados
 */
export type SubscriptionType =
    | 'NONE'
    | 'EVERY'
    | 'BATCH'
    | 'WATCH_STORE'
    | 'SSE'
    | 'EVENT'
    | 'CUSTOM'
    | 'RECEIVE_MSG';

/**
 * Información de una suscripción activa
 */
export interface ActiveSubscription {
    type: SubscriptionType;
    id: string;
    unsubscribe?: () => void;
    interval?: any;
    eventSource?: any;
    lastValue?: any;
    timeoutId?: any; // Para cleanup de timeouts
}

/**
 * Opciones del SubscriptionManager
 * Usa getter para dispatch dinámico
 */
export interface SubscriptionManagerOptions<TMsg> {
    /** Función que retorna las suscripciones según el modelo */
    subscriptionFn: (model: any) => SubDescriptor<TMsg>;
    /** Función getter para obtener dispatch dinámicamente */
    getDispatch: () => (msg: TMsg) => void;
    /** Callback cuando cambia el cleanup */
    onCleanup?: (cleanupFn: () => void) => void;
    /** Callback cuando cambia el modelo */
    onModelChange?: (model: any, dispatch: (msg: TMsg) => void) => void;
}

/**
 * Gestor de suscripciones del Motor TEA.
 * Maneja la activación, monitoreo y limpieza de suscripciones.
 */
export class SubscriptionManager<TMsg> {
    private activeSubs = new Map<string, ActiveSubscription>();
    private lastIds = new Set<string>();
    private isInitialized = false;
    private pendingTimeouts = new Map<string, NodeJS.Timeout>();
    private lastSubDescriptor: SubDescriptor<TMsg> | null = null;

    constructor(private options: SubscriptionManagerOptions<TMsg>) { }

    /**
     * Obtiene el dispatch de forma dinámica con validación de seguridad.
     */
    private getDispatch(): (msg: TMsg) => void {
        const dispatch = this.options.getDispatch();
        if (typeof dispatch !== 'function') {
            log.error('Critical: dispatch is not a function in SubscriptionManager.', { dispatch });
            // Fallback no-op to prevent fatal crash
            return (msg: TMsg) => {
                log.warn('Message dropped in SubscriptionManager: dispatch is missing.', msg);
            };
        }
        return dispatch;
    }

    /**
     * Inicializa el gestor y ejecuta el primer ciclo de suscripciones
     */
    initialize(model: any): void {
        this.manageSubscriptions(model);
        this.isInitialized = true;
    }

    /**
     * Obtiene los IDs activos de una descripción de suscripción
     */
    getActiveIds(sub: SubDescriptor<TMsg>, ids: Set<string> = new Set()): Set<string> {
        if (sub.type === 'BATCH') {
            sub.payload?.forEach((s: SubDescriptor<TMsg>) => this.getActiveIds(s, ids));
        } else if (
            (sub.type === 'EVERY' ||
                sub.type === 'WATCH_STORE' ||
                sub.type === 'SSE' ||
                sub.type === 'EVENT' ||
                sub.type === 'CUSTOM' ||
                sub.type === 'RECEIVE_MSG') &&
            sub.payload?.id
        ) {
            ids.add(sub.payload.id);
        }
        return ids;
    }

    /**
     * Gestiona el ciclo de suscripciones
     */
    manageSubscriptions(model: any): void {
        const { subscriptionFn } = this.options;
        const dispatch = this.getDispatch();

        // Llamar a subscriptionFn SOLO si el modelo ha cambiado de forma relevante
        // Para evitar llamadas innecesarias, primero intentamos con un shallow check
        const currentSub = subscriptionFn(model);

        // Validación de tipos
        if (!currentSub || typeof currentSub !== 'object' || !currentSub.type) {
            log.error(
                `Invalid subscription returned from subscriptions(). Expected SubDescriptor, got: ${typeof currentSub}`,
                'ENGINE',
                { currentSub, modelType: typeof model }
            );
            return;
        }

        const currentIds = this.getActiveIds(currentSub);
        const currentIdsArray = Array.from(currentIds).sort().join(',');
        const lastIdsArray = Array.from(this.lastIds).sort().join(',');

        // Si los IDs son exactamente los mismos, no necesitamos reprocesar
        if (currentIdsArray === lastIdsArray && this.lastSubDescriptor !== null) {
            return;
        }

        // Verificar si changed las suscripciones
        const hasCurrentSubs = currentIds.size > 0;
        const wasEmptyBefore = this.lastIds.size === 0;
        const hasActiveSubs = Array.from(currentIds).some(id => this.activeSubs.has(id));

        const idsChanged =
            currentIds.size !== this.lastIds.size ||
            (hasCurrentSubs && !hasActiveSubs) ||
            (hasCurrentSubs && wasEmptyBefore);

        if (!idsChanged) {
            return;
        }

        this.lastIds = currentIds;
        this.lastSubDescriptor = currentSub;
        this.cleanupSubs(currentIds);
        this.processSub(currentSub, dispatch);
    }

    /**
     * Procesa una descripción de suscripción
     */
    processSub(sub: SubDescriptor<TMsg>, dispatch: (msg: TMsg) => void): void {
        if (sub.type === 'BATCH') {
            sub.payload?.forEach((s: SubDescriptor<TMsg>) => this.processSub(s, dispatch));
            return;
        }

        if (sub.type === 'EVERY') {
            this.processEvery(sub, dispatch);
        } else if (sub.type === 'WATCH_STORE') {
            this.processWatchStore(sub, dispatch);
        } else if (sub.type === 'EVENT') {
            this.processEvent(sub, dispatch);
        } else if (sub.type === 'SSE') {
            this.processSSE(sub, dispatch);
        } else if (sub.type === 'RECEIVE_MSG') {
            this.processReceiveMsg(sub, dispatch);
        } else if (sub.type === 'CUSTOM') {
            this.processCustom(sub, dispatch);
        }
    }

    /**
     * Suscripción tipo EVERY (intervalo)
     */
    private processEvery(sub: SubDescriptor<TMsg>, dispatch: (msg: TMsg) => void): void {
        const { id, ms, msg } = sub.payload;
        if (!id || this.activeSubs.has(id)) return;

        log.debug(`Starting interval sub: ${id} (${ms}ms)`, 'ENGINE');
        const interval = setInterval(() => dispatch(msg), ms);
        this.activeSubs.set(id, { type: 'EVERY', id, interval });
    }

    /**
     * Suscripción tipo WATCH_STORE (observar store externo)
     */
    private processWatchStore(sub: SubDescriptor<TMsg>, dispatch: (msg: TMsg) => void): void {
        const { id, store: externalStoreRef, selector, msgCreator } = sub.payload;
        if (!id || this.activeSubs.has(id)) return;

        const activateWatch = (externalStore: StoreApi<any>) => {
            log.debug(`Activating reactive sub: ${id} (WATCH_STORE)`, 'ENGINE');

            const initialState = externalStore.getState();
            const initialValue = selector(initialState.model || initialState);
            let lastValue = initialValue;

            const unsubscribe = externalStore.subscribe((state: any) => {
                const selectedValue = selector(state.model || state);
                if (selectedValue != null && !isDeepEqual(selectedValue, lastValue)) {
                    lastValue = selectedValue;
                    const msg = msgCreator(selectedValue);
                    if (msg) dispatch(msg);
                }
            });

            this.activeSubs.set(id, { type: 'WATCH_STORE', id, unsubscribe, lastValue });

            // Disparo inicial diferido
            const timeoutId = setTimeout(() => {
                if (this.activeSubs.has(id)) {
                    const msg = msgCreator(initialValue);
                    if (msg) dispatch(msg);
                }
                this.pendingTimeouts.delete(id);
            }, 50);
            this.pendingTimeouts.set(id, timeoutId);
        };

        let externalStore: StoreApi<any> | undefined;

        if (typeof externalStoreRef === 'string') {
            externalStore = storeRegistry.get(externalStoreRef);
            if (!externalStore) {
                log.info(`WATCH_STORE sub "${id}" waiting for store "${externalStoreRef}"...`, 'ENGINE');
                const unregisterListener = storeRegistry.subscribe((regId, regStore) => {
                    if (regId === externalStoreRef && regStore) {
                        unregisterListener();
                        if (!this.activeSubs.has(id)) {
                            activateWatch(regStore);
                        }
                    }
                });
                this.activeSubs.set(id, { type: 'WATCH_STORE', id, unsubscribe: unregisterListener });
                return;
            }
        } else if (externalStoreRef && typeof externalStoreRef.getState === 'function') {
            externalStore = externalStoreRef;
        }

        if (externalStore) {
            activateWatch(externalStore);
        } else {
            log.warn(`WATCH_STORE sub "${id}" could not resolve store ref.`, 'ENGINE', { storeRef: externalStoreRef });
        }
    }

    /**
     * Suscripción tipo EVENT (eventos externos)
     */
    private processEvent(sub: SubDescriptor<TMsg>, dispatch: (msg: TMsg) => void): void {
        const { id, event, target, msgCreator } = sub.payload;
        if (!id || this.activeSubs.has(id)) return;

        log.debug(`Starting reactive sub: ${id} (EVENT)`, 'ENGINE');
        const handler = globalEventRegistry.getHandler(event);
        if (!handler) {
            log.warn(`No handler registered for event type: ${event.type}`, 'ENGINE');
            return;
        }

        const resolvedTarget = typeof target === 'function' ? target() : target;
        const unsubscribe = handler.subscribe(resolvedTarget, (eventData: any) => {
            dispatch(msgCreator(eventData));
        });
        this.activeSubs.set(id, { type: 'EVENT', id, unsubscribe });
    }

    /**
     * Suscripción tipo SSE (Server-Sent Events)
     */
    private processSSE(sub: SubDescriptor<TMsg>, dispatch: (msg: TMsg) => void): void {
        const { id, url, msgCreator, headers } = sub.payload;
        if (!id || this.activeSubs.has(id)) return;

        log.info(`Connecting to SSE stream: ${url}`, 'ENGINE');

        let isCancelled = false;
        const placeholder = { close: () => { isCancelled = true; } };
        this.activeSubs.set(id, { type: 'SSE', id, eventSource: placeholder });

        // Cleanup del timeout anterior si existe
        const existingTimeout = this.pendingTimeouts.get(id);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
            this.pendingTimeouts.delete(id);
        }

        const timeoutId = setTimeout(() => {
            this.pendingTimeouts.delete(id);

            if (isCancelled || !this.activeSubs.has(id)) {
                log.debug(`SSE connection cancelled before start: ${id}`, 'ENGINE');
                return;
            }

            try {
                const GlobalEventSource = (global as any).EventSource ||
                    (window as any).EventSource ||
                    (typeof EventSource !== 'undefined' ? EventSource : null);

                if (!GlobalEventSource) {
                    throw new Error("EventSource is not defined in this environment");
                }

                const eventSource = new GlobalEventSource(url, {
                    headers,
                    heartbeatTimeout: 45000
                });

                eventSource.onmessage = (event: any) => {
                    try {
                        const data = JSON.parse(event.data);
                        log.debug('SSE Message received', 'ENGINE', data);
                        dispatch(msgCreator(data));
                    } catch (e) {
                        log.error('Error parsing SSE data', 'ENGINE', e);
                    }
                };

                eventSource.onerror = (error: any) => {
                    log.error(`SSE Stream Error for ${id}`, 'ENGINE', error);
                    try { eventSource.close(); } catch (e) { /* ignore */ }
                    this.activeSubs.delete(id);
                    this.lastIds.delete(id);
                };

                if (isCancelled || !this.activeSubs.has(id)) {
                    eventSource.close();
                    return;
                }

                this.activeSubs.set(id, { type: 'SSE', id, eventSource });
            } catch (e) {
                log.error(`Failed to create EventSource for ${id}`, 'ENGINE', e);
                this.activeSubs.delete(id);
            }
        }, 500);

        this.pendingTimeouts.set(id, timeoutId);
    }

    /**
     * Suscripción tipo RECEIVE_MSG (señales globales)
     */
    private processReceiveMsg(sub: SubDescriptor<TMsg>, dispatch: (msg: TMsg) => void): void {
        const { id, signal, handler } = sub.payload;
        const signalType = signal.toString();
        if (!id || this.activeSubs.has(id)) return;

        log.debug(`Starting global signal sub: ${id} (${signalType})`, 'ENGINE');
        const unsubscribe = globalSignalBus.subscribe(signalType, (payload) => {
            handler(payload, dispatch);
        });
        this.activeSubs.set(id, { type: 'RECEIVE_MSG', id, unsubscribe });
    }

    /**
     * Suscripción tipo CUSTOM
     */
    private processCustom(sub: SubDescriptor<TMsg>, dispatch: (msg: TMsg) => void): void {
        const { id, subscribe } = sub.payload;
        if (!id || this.activeSubs.has(id)) return;

        log.debug(`Starting custom sub: ${id}`, 'ENGINE');
        const unsubscribe = subscribe(dispatch);
        this.activeSubs.set(id, { type: 'CUSTOM', id, unsubscribe });
    }

    /**
     * Limpia suscripciones que ya no están activas
     */
    private cleanupSubs(currentSubs: Set<string>): void {
        this.activeSubs.forEach((sub, id) => {
            if (!currentSubs.has(id)) {
                if (sub.type === 'EVERY') {
                    clearInterval(sub.interval);
                } else if (sub.unsubscribe) {
                    sub.unsubscribe();
                } else if (sub.type === 'SSE') {
                    log.info(`Disconnecting SSE stream: ${id}`, 'ENGINE');
                    sub.eventSource?.close();
                }

                // Cleanup de timeout pendiente
                const pendingTimeout = this.pendingTimeouts.get(id);
                if (pendingTimeout) {
                    clearTimeout(pendingTimeout);
                    this.pendingTimeouts.delete(id);
                }

                this.activeSubs.delete(id);
            }
        });
    }

    /**
     * Limpia todas las suscripciones
     */
    cleanupAll(): void {
        log.debug('Engine cleanup: Stopping all subscriptions', 'ENGINE_CLEANUP');

        // Cleanup de todos los timeouts pendientes
        this.pendingTimeouts.forEach((timeout) => {
            clearTimeout(timeout);
        });
        this.pendingTimeouts.clear();

        this.cleanupSubs(new Set());
    }

    /**
     * Obtiene el número de suscripciones activas
     */
    getActiveCount(): number {
        return this.activeSubs.size;
    }

    /**
     * Verifica si hay suscripciones activas
     */
    hasActiveSubscriptions(): boolean {
        return this.activeSubs.size > 0;
    }
}

/**
 * Factory para crear SubscriptionManager
 */
export function createSubscriptionManager<TMsg>(
    options: SubscriptionManagerOptions<TMsg>
): SubscriptionManager<TMsg> {
    return new SubscriptionManager<TMsg>(options);
}
