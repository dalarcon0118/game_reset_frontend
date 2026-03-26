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
    const summary = model.summary.type === 'Success' ? model.summary.data : null;

    if (!summary || !summary.health_metrics) {
        return [
            { id: 'reserve', label: es.banker.dashboard.health.metrics.reserveRatio, value: es.banker.dashboard.health.values.na, status: 'unknown' },
            { id: 'performance', label: es.banker.dashboard.health.metrics.agencyPerformance, value: es.banker.dashboard.health.values.na, status: 'unknown' },
            { id: 'risk', label: es.banker.dashboard.health.metrics.riskLevel, value: es.banker.dashboard.health.values.na, status: 'unknown' },
            { id: 'trend', label: es.banker.dashboard.health.metrics.growthTrend, value: es.banker.dashboard.health.values.na, status: 'unknown' }
        ];
    }

    const { health_metrics } = summary;

    const getRiskStatus = (level: string): HealthStatus => {
        switch (level) {
            case 'LOW': return 'excellent';
            case 'MEDIUM': return 'good';
            case 'HIGH':
            case 'CRITICAL': return 'critical';
            default: return 'unknown';
        }
    };

    const getSolvencyStatus = (ratio: number): HealthStatus => {
        if (ratio >= 30) return 'excellent';
        if (ratio >= 20) return 'good';
        return 'critical';
    };

    const getTrendStatus = (trend: number): HealthStatus => {
        if (trend > 0) return 'excellent';
        if (trend > -10) return 'good';
        return 'critical';
    };

    return [
        {
            id: 'reserve',
            label: es.banker.dashboard.health.metrics.reserveRatio,
            value: `${health_metrics.solvency_ratio}%`,
            status: getSolvencyStatus(health_metrics.solvency_ratio)
        },
        {
            id: 'performance',
            label: es.banker.dashboard.health.metrics.agencyPerformance,
            value: `$${health_metrics.net_result.toLocaleString()}`,
            status: health_metrics.net_result > 0 ? 'excellent' : 'critical'
        },
        {
            id: 'risk',
            label: es.banker.dashboard.health.metrics.riskLevel,
            value: health_metrics.risk_level,
            status: getRiskStatus(health_metrics.risk_level)
        },
        {
            id: 'trend',
            label: es.banker.dashboard.health.metrics.growthTrend,
            value: `${health_metrics.trend_percentage > 0 ? '+' : ''}${health_metrics.trend_percentage}%`,
            status: getTrendStatus(health_metrics.trend_percentage)
        }
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
