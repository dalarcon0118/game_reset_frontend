import { Registry } from '../utils/registry';

export interface EventDescriptor {
    readonly type: string;
    readonly platform: 'generic' | 'react-native' | 'dom';
    readonly eventName: string;
    readonly options?: any;
}

export interface EventHandler<T = any> {
    subscribe(target: any, handler: (event: T) => void): () => void;
}

export interface EventRegistry {
    register(event: EventDescriptor, handler: EventHandler): void;
    getHandler(event: EventDescriptor): EventHandler | undefined;
    unregister(event: EventDescriptor): void;
}

export class SimpleEventRegistry implements EventRegistry {
    private registry = new Registry<EventHandler>('EVENT_REGISTRY');

    register(event: EventDescriptor, handler: EventHandler): void {
        this.registry.register(event.type, handler, true); // Overwrite by default in original implementation? It was just set()
    }

    getHandler(event: EventDescriptor): EventHandler | undefined {
        return this.registry.get(event.type);
    }

    unregister(event: EventDescriptor): void {
        this.registry.unregister(event.type);
    }
}

export const globalEventRegistry = new SimpleEventRegistry();