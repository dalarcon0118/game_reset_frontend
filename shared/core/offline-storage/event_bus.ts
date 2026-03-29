import { EventBusPort, DomainEvent, DomainEventCallback, Unsubscribe } from './types';

/**
 * Implementación del Bus de Eventos para el almacenamiento offline
 */
class OfflineEventBus implements EventBusPort {
  private subscribers = new Set<DomainEventCallback>();

  publish<T>(event: DomainEvent<T>): void {
    console.log(`[OFFLINE-EVENT-BUS] Publishing event: ${event.type} to ${this.subscribers.size} subscribers`, event);
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
    console.log(`[OFFLINE-EVENT-BUS] New subscriber added. Total subscribers: ${this.subscribers.size}`);
    return () => {
      this.subscribers.delete(callback);
      console.log(`[OFFLINE-EVENT-BUS] Subscriber removed. Total subscribers: ${this.subscribers.size}`);
    };
  }

  clearSubscribers(): void {
    console.log(`[OFFLINE-EVENT-BUS] Clearing ${this.subscribers.size} subscribers`);
    this.subscribers.clear();
  }
}

export const offlineEventBus = new OfflineEventBus();
