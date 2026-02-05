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
    private handlers = new Map<string, EventHandler>();

    register(event: EventDescriptor, handler: EventHandler): void {
        this.handlers.set(event.type, handler);
    }

    getHandler(event: EventDescriptor): EventHandler | undefined {
        return this.handlers.get(event.type);
    }

    unregister(event: EventDescriptor): void {
        this.handlers.delete(event.type);
    }
}

export const globalEventRegistry = new SimpleEventRegistry();