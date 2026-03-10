import { WebData } from '@/shared/core/tea-utils';
import { FinancialSummary, DrawType, BetType } from '@/types';
import { StatusFilter, DailyTotals } from './core.types';
import { DashboardUser } from './user.dto';

export type DashboardStatus =
    | { type: 'IDLE' }                               // Esperando datos iniciales (Estructura/Token)
    | { type: 'PREPARING_SESSION' }                  // Ejecutando prepareDailySessionUseCase
    | { type: 'LOADING_DATA' }                       // Cargando Draws y Summary
    | { type: 'READY' }                              // Todo cargado y funcional
    | { type: 'ERROR'; message: string };            // Fallo crítico en la inicialización

export interface Model {
    status: DashboardStatus; // El "cerebro" de la inicialización
    draws: WebData<DrawType[]>;
    filteredDraws: DrawType[];
    summary: WebData<FinancialSummary>;
    pendingBets: BetType[];
    syncedBets: BetType[]; // Todas las apuestas sincronizadas del día
    dailyTotals: DailyTotals;
    userStructureId: string | null;
    statusFilter: StatusFilter;
    appliedFilter: StatusFilter;
    commissionRate: number;
    showBalance: boolean;
    authToken: string | null;
    currentUser: DashboardUser | null;
    isRateLimited: boolean;
}
