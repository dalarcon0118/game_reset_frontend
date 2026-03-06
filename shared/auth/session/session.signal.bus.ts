import { SessionSignal, SessionSignalType } from './session.types';

type SignalListener = (signal: SessionSignal) => void;

/**
 * SessionSignalBus: Bus de eventos minimalista para desacoplar el Coordinator de otras capas.
 */
export class SessionSignalBus {
    private static instance: SessionSignalBus;
    private listeners: Set<SignalListener> = new Set();

    private constructor() {}

    static getInstance(): SessionSignalBus {
        if (!this.instance) {
            this.instance = new SessionSignalBus();
        }
        return this.instance;
    }

    /**
     * Publica una señal en el bus.
     */
    publish(signal: SessionSignal): void {
        this.listeners.forEach(listener => {
            try {
                listener(signal);
            } catch (error) {
                console.error('[SessionSignalBus] Error in listener:', error);
            }
        });
    }

    /**
     * Se suscribe a las señales del bus.
     */
    subscribe(listener: SignalListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
}
