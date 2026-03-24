import { WebData } from '@core/tea-utils';
import { Agency, DashboardSummary } from '@/shared/repositories/structure/domain/models';
import { es } from '@/config/language/es';

/**
 * 📊 VIEW MODELS
 * Domain-specific data structures for the UI.
 */

export type HealthStatus = 'excellent' | 'good' | 'critical' | 'unknown';
export type HealthMetricType = 'reserve' | 'performance' | 'risk' | 'trend';

export interface HealthMetric {
    id: HealthMetricType;
    label: string;
    value: string;
    status: HealthStatus;
}

export interface StatViewModel {
    label: string;
    value: string;
    type: 'collected' | 'profit' | 'commissions' | 'reserves';
}

/**
 * 🧱 CORE MODEL
 */

export interface Model {
    agencies: WebData<Agency[]>;
    summary: WebData<DashboardSummary>;
    selectedAgencyId: number | null;
    isSystemReady: boolean;
    userStructureId: string | null;
}

/**
 * 🎯 DASHBOARD SELECTORS
 * Pure functions to extract and transform data from the model.
 * These are placed in the model file for "Clean Architecture" consolidation.
 */

export const selectIsLoading = (model: Model): boolean => {
    return !model.isSystemReady || model.agencies.type === 'Loading' || model.summary.type === 'Loading';
};

/**
 * Option 1: Consolidation. 
 * Directly returns domain Agency, UI handles display.
 */
export const selectAgencies = (model: Model): Agency[] => {
    return model.agencies.type === 'Success' ? model.agencies.data : [];
};

export const selectDashboardStats = (model: Model): StatViewModel[] => {
    const summary = model.summary.type === 'Success' ? model.summary.data : {
        totalCollected: 0,
        netCollected: 0,
        totalPremiums: 0,
        totalCommissions: 0,
        netProfit: 0,
        bankReserves: 0,
        activeAgencies: 0
    };

    const formatCurrency = (val: number) => `$${val.toLocaleString()}`;

    // Map Domain Summary to StatViewModel for UI using pre-calculated fields
    return [
        {
            label: es.banker.dashboard.stats.totalCollected,
            value: formatCurrency(summary.totalCollected),
            type: 'collected'
        },
        {
            label: es.banker.dashboard.stats.netProfit,
            value: formatCurrency(summary.netProfit),
            type: 'profit'
        },
        {
            label: es.banker.dashboard.stats.commissionsPaid,
            value: formatCurrency(summary.totalCommissions),
            type: 'commissions'
        },
        {
            label: es.banker.dashboard.stats.bankReserves,
            value: formatCurrency(summary.bankReserves),
            type: 'reserves'
        }
    ];
};

export const selectHealthMetrics = (model: Model): HealthMetric[] => {
    const agencies = model.agencies.type === 'Success' ? model.agencies.data : null;

    if (!agencies || agencies.length === 0) {
        return [
            { id: 'reserve', label: es.banker.dashboard.health.metrics.reserveRatio, value: es.banker.dashboard.health.values.na, status: 'unknown' },
            { id: 'performance', label: es.banker.dashboard.health.metrics.agencyPerformance, value: es.banker.dashboard.health.values.na, status: 'unknown' },
            { id: 'risk', label: es.banker.dashboard.health.metrics.riskLevel, value: es.banker.dashboard.health.values.na, status: 'unknown' },
            { id: 'trend', label: es.banker.dashboard.health.metrics.growthTrend, value: es.banker.dashboard.health.values.na, status: 'unknown' }
        ];
    }

    // Since we consolidated calculations into the summary/mapper, we can simplify this or use the summary directly.
    // For specific metrics per agency, we still use the agencies array.
    const totalCollected = agencies.reduce((sum, a) => sum + a.totalCollected, 0);
    const netCollected = agencies.reduce((sum, a) => sum + a.netCollected, 0);

    const reserveRatio = totalCollected > 0 ? ((netCollected / totalCollected) * 100) : 0;
    const avgPerformance = agencies.reduce((sum, a) => {
        return sum + (a.totalCollected > 0 ? (a.netCollected / a.totalCollected) * 100 : 0);
    }, 0) / agencies.length;

    const riskLevel = reserveRatio > 80 ? es.banker.dashboard.health.values.low :
        reserveRatio > 50 ? es.banker.dashboard.health.values.medium : es.banker.dashboard.health.values.high;

    const growthTrend = netCollected > 0 ? es.banker.dashboard.health.values.positive : es.banker.dashboard.health.values.negative;

    return [
        { id: 'reserve', label: es.banker.dashboard.health.metrics.reserveRatio, value: `${reserveRatio.toFixed(1)}%`, status: reserveRatio > 70 ? 'excellent' : reserveRatio > 40 ? 'good' : 'critical' },
        { id: 'performance', label: es.banker.dashboard.health.metrics.agencyPerformance, value: `${avgPerformance.toFixed(1)}%`, status: avgPerformance > 75 ? 'excellent' : avgPerformance > 50 ? 'good' : 'critical' },
        { id: 'risk', label: es.banker.dashboard.health.metrics.riskLevel, value: riskLevel, status: riskLevel === es.banker.dashboard.health.values.low ? 'excellent' : riskLevel === es.banker.dashboard.health.values.medium ? 'good' : 'critical' },
        { id: 'trend', label: es.banker.dashboard.health.metrics.growthTrend, value: growthTrend, status: growthTrend === es.banker.dashboard.health.values.positive ? 'excellent' : 'critical' }
    ];
};

export const selectOverallHealth = (model: Model): { status: HealthStatus; label: string } => {
    const metrics = selectHealthMetrics(model);
    const excellentCount = metrics.filter(m => m.status === 'excellent').length;
    const goodCount = metrics.filter(m => m.status === 'good').length;
    const unknownCount = metrics.filter(m => m.status === 'unknown').length;

    if (unknownCount === metrics.length) return { status: 'unknown', label: es.banker.dashboard.health.values.na };
    if (excellentCount >= 3) return { status: 'excellent', label: es.banker.dashboard.health.values.excellent };
    if (excellentCount + goodCount >= 3) return { status: 'good', label: es.banker.dashboard.health.values.good };
    return { status: 'critical', label: es.banker.dashboard.health.values.critical };
};
