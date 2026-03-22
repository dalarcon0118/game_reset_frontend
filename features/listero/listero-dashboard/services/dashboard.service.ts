import { betRepository } from '@/shared/repositories/bet/bet.repository';
import { IBetRepository } from '@/shared/repositories/bet/bet.types';
import { logger, Logger } from '@/shared/utils/logger';

/**
 * DashboardService: Orquestador de lógica de aplicación para el Dashboard.
 * Centraliza suscripciones, aplica debounce y desacopla la UI de los repositorios.
 */
export interface DashboardDeps {
    betRepository: IBetRepository;
    log: Logger;
}

export class DashboardService {
    private subscribers: Set<() => void> = new Set();
    private debounceTimeout: NodeJS.Timeout | null = null;
    private readonly DEBOUNCE_MS = 300;
    static instance: any;

    constructor(private readonly deps: DashboardDeps) {
        // Suscribirse al repositorio inyectado
        this.deps.betRepository.onBetChanged(() => {
            this.handleBetChange();
        });
    }

    /**
     * Factory method para crear la instancia con las dependencias reales de producción.
     * Mantiene el control de la instanciación dentro del mismo dominio del servicio.
     */
    static getInstance(): DashboardService {
        // Si ya existe una instancia, la devolvemos
        if (DashboardService.instance) {
            return DashboardService.instance;
        }
        // Si no existe, la creamos
        DashboardService.instance = new DashboardService({
            betRepository: betRepository,
            log: logger.withTag('DASHBOARD_SERVICE')
        });
        return DashboardService.instance;
    }

    /**
     * Suscripción para que los componentes del Dashboard escuchen cambios relevantes.
     */
    onDashboardInvalided(callback: () => void): () => void {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    /**
     * Fuerza la invalidación del Dashboard manualmente (ej. en un Refresh).
     */
    invalidateDashboard(): void {
        this.deps.log.info('Manual dashboard invalidation triggered');
        this.notifySubscribers();
    }

    private handleBetChange(): void {
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }

        this.debounceTimeout = setTimeout(() => {
            this.deps.log.info('Dashboard data invalidated, notifying subscribers');
            this.notifySubscribers();
            this.debounceTimeout = null;
        }, this.DEBOUNCE_MS);
    }

    private notifySubscribers(): void {
        this.subscribers.forEach(cb => {
            try {
                cb();
            } catch (error) {
                this.deps.log.error('Error in dashboard subscriber callback', error);
            }
        });
    }
}

// Exportamos la instancia por defecto generada por la factory
export const dashboardService = DashboardService.getInstance();
