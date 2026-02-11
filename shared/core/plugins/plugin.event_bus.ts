/**
 * Bus de eventos desacoplado para la comunicación entre plugins.
 * Implementa el patrón Publish/Subscribe.
 */
type Handler = (data: any) => void;

class PluginEventBus {
    private subscribers: Map<string, Set<Handler>> = new Map();

    /**
     * Suscribe un manejador a un evento específico.
     * Retorna una función para cancelar la suscripción.
     */
    subscribe(event: string, handler: Handler): () => void {
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, new Set());
        }
        
        const handlers = this.subscribers.get(event)!;
        handlers.add(handler);

        return () => {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.subscribers.delete(event);
            }
        };
    }

    /**
     * Publica un evento con datos opcionales.
     */
    publish(event: string, data?: any): void {
        const handlers = this.subscribers.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`[PluginEventBus] Error en manejador de evento "${event}":`, error);
                }
            });
        }
    }

    /**
     * Limpia todas las suscripciones.
     */
    clear(): void {
        this.subscribers.clear();
    }
}

export const pluginEventBus = new PluginEventBus();
