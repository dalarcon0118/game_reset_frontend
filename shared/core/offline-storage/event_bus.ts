import { EventBusPort, DomainEvent, DomainEventCallback, Unsubscribe } from './types';

/**
 * Implementación del Bus de Eventos para el almacenamiento offline
 */
class OfflineEventBus implements EventBusPort {
  private subscribers = new Set<DomainEventCallback>();

  publish<T>(event: DomainEvent<T>): void {
    this.subscribers.forEach(cb => {
      try {
        cb(event);
      } catch (e) {
        console.error('Error in offline event subscriber', e);
      }
    });
  }

  subscribe(callback: DomainEventCallback): Unsubscribe {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
}

export const offlineEventBus = new OfflineEventBus();
