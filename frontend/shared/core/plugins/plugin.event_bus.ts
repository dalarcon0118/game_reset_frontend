import { logger } from '../../utils/logger';

type Handler = (data: any) => void;

/**
 * Bus de eventos agnóstico para comunicación entre plugins.
 * Implementa un patrón Publish/Subscribe simple.
 */
class PluginEventBus {
    private subscribers: Map<string, Set<Handler>> = new Map();

    /**
     * Suscribe un handler a un evento específico.
     * @returns Función para desuscribirse.
     */
    subscribe(event: string, handler: Handler): () => void {
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, new Set());
        }
        
        this.subscribers.get(event)?.add(handler);
        
        return () => {
            this.subscribers.get(event)?.delete(handler);
            if (this.subscribers.get(event)?.size === 0) {
                this.subscribers.delete(event);
            }
        };
    }

    /**
     * Emite un evento con datos opcionales.
     */
    publish(event: string, data?: any): void {
        const handlers = this.subscribers.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    logger.error(`[PluginEventBus] Error in handler for event "${event}":`, error);
                }
            });
        }
    }

    /**
     * Limpia todos los suscriptores. Útil para hot-reload o tests.
     */
    clear(): void {
        this.subscribers.clear();
    }
}

export const pluginEventBus = new PluginEventBus();
