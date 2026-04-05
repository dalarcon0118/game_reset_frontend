import { EventBusPort, DomainEvent, DomainEventCallback, Unsubscribe } from './types';

/**
 * Implementación del Bus de Eventos para el almacenamiento offline
 * Con throttle por entidad para evitar tormenta de eventos
 */
class OfflineEventBus implements EventBusPort {
  private subscribers = new Set<DomainEventCallback>();
  private lastEventTime: Map<string, number> = new Map();
  private readonly THROTTLE_MS = 500; // 500ms de throttle por entidad

  /**
   * Genera una clave única para el throttle basada en tipo y entidad
   */
  private getThrottleKey(event: DomainEvent): string {
    return `${event.type}:${event.entity || 'global'}`;
  }

  /**
   * Verifica si el evento debe ser throttleado
   */
  private shouldThrottle(event: DomainEvent): boolean {
    const key = this.getThrottleKey(event);
    const now = Date.now();
    const lastTime = this.lastEventTime.get(key) || 0;
    
    if (now - lastTime < this.THROTTLE_MS) {
      console.log(`[OFFLINE-EVENT-BUS] Throttling event: ${event.type} for entity: ${event.entity || 'global'}`);
      return true;
    }
    
    this.lastEventTime.set(key, now);
    return false;
  }

  publish<T>(event: DomainEvent<T>): void {
    // Throttle eventos duplicados en corto período de tiempo
    if (this.shouldThrottle(event)) {
      return;
    }

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
    this.lastEventTime.clear();
  }
}

export const offlineEventBus = new OfflineEventBus();
