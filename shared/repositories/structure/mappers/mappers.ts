import { BackendChildStructure, BackendDashboardSummary, BackendListeroDrawDetail, ListeroDrawDetail } from '../types/types';
import { Agency, DashboardSummary, StructureNodeType, HealthMetrics } from '../domain/models';

const sanitize = (val: number | undefined | null): number => Math.max(0, val || 0);

const formatLocalTime = (utcTimestamp: string | null | undefined): string => {
    if (!utcTimestamp) return 'N/A';
    try {
        const date = new Date(utcTimestamp);
        if (isNaN(date.getTime())) return 'N/A';
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: userTimeZone
        });
    } catch {
        return 'N/A';
    }
};

/**
 * Pure mappers to transform Backend/Infrastructure data into Domain entities.
 * Following TEA principles: decoding and transformation happens at the boundaries.
 */
export const StructureMapper = {
    /**
     * Transforms a single Backend structure child into a Domain Agency
     * Includes Sanitization (Option 3)
     */
    toAgency: (backend: BackendChildStructure): Agency => ({
        id: backend.id,
        name: backend.name,
        type: (backend.type || 'agency') as StructureNodeType,
        totalCollected: sanitize(backend.total_collected),
        netCollected: sanitize(backend.net_collected),
        premiumsPaid: sanitize(backend.premiums_paid),
        commissions: sanitize(backend.commissions),
        drawName: backend.draw_name || '',
        drawIds: Array.isArray(backend.draw_ids) ? backend.draw_ids : [],
    }),

    /**
     * Transforms an array of Backend structures into Domain Agencies
     */
    toAgencies: (backendList: BackendChildStructure[]): Agency[] =>
        backendList.map(StructureMapper.toAgency),

    /**
     * Transforms a Backend Dashboard Summary into a Domain DashboardSummary
     */
    toDashboardSummary: (backend: BackendDashboardSummary): DashboardSummary => {
        const metrics = backend.health_metrics;
        const trendPercentage = metrics.trend_percentage ?? metrics.trend ?? 0;
        const netResult = metrics.net_result ?? backend.netTotal;
        const riskLevel = metrics.risk_level ?? (
            metrics.status === 'healthy'
                ? 'LOW'
                : metrics.status === 'warning'
                    ? 'MEDIUM'
                    : 'HIGH'
        );

        return {
            totalCollected: backend.totalCollected,
            netCollected: backend.netTotal,
            totalPremiums: backend.totalPaid,
            totalPending: backend.totalPending,
            totalCommissions: 0,
            netProfit: backend.netTotal,
            bankReserves: netResult,
            activeAgencies: 0,
            health_metrics: {
                solvency_ratio: metrics.solvency_ratio,
                trend_percentage: trendPercentage,
                risk_level: riskLevel,
                net_result: netResult,
                total_pending_prizes: metrics.total_pending_prizes
            }
        };
    },

    /**
     * Calculates the Dashboard Summary from a list of Domain Agencies
     * Now includes netProfit and bankReserves directly (Option 1)
     */
    calculateSummary: (agencies: Agency[]): DashboardSummary => {
        const rawSummary = agencies.reduce((acc, curr) => ({
            totalCollected: acc.totalCollected + curr.totalCollected,
            netCollected: acc.netCollected + curr.netCollected,
            totalPremiums: acc.totalPremiums + curr.premiumsPaid,
            totalPending: acc.totalPending, // Agencies don't have pending prizes yet in domain model
            totalCommissions: acc.totalCommissions + curr.commissions,
            activeAgencies: acc.activeAgencies + (curr.totalCollected > 0 ? 1 : 0)
        }), {
            totalCollected: 0,
            netCollected: 0,
            totalPremiums: 0,
            totalPending: 0,
            totalCommissions: 0,
            activeAgencies: 0
        });

        // Business Logic: netProfit and bankReserves calculation
        const netProfit = rawSummary.netCollected;
        const bankReserves = Math.max(0, netProfit - rawSummary.totalCommissions);

        return {
            ...rawSummary,
            netProfit,
            bankReserves
        };
    },

    toListeroDrawDetail: (backend: BackendListeroDrawDetail): ListeroDrawDetail => ({
        draw_id: backend.draw_id,
        draw_name: backend.draw_name,
        draw_type_code: backend.draw_type_code,
        draw_type_name: backend.draw_type_name,
        draw_type_extra_data: backend.draw_type_extra_data,
        status: backend.status,
        winning_number: backend.winning_number,
        opening_time: formatLocalTime(backend.opening_time),
        closing_time: formatLocalTime(backend.closing_time),
        total_collected: sanitize(backend.total_collected),
        total_paid: sanitize(backend.total_paid),
        net_result: sanitize(backend.net_result),
        commissions: sanitize(backend.commissions),
        status_closed: backend.status_closed
    }),

    toListeroDrawDetails: (backendList: BackendListeroDrawDetail[]): ListeroDrawDetail[] =>
        backendList.map(StructureMapper.toListeroDrawDetail)
};
