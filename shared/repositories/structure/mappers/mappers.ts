import { BackendChildStructure } from '../types/types';
import { Agency, DashboardSummary, StructureNodeType } from '../domain/models';

/**
 * 🛠️ HELPER: Sanitization for financial values
 * Ensures no negative values reach the domain layer.
 */
const sanitize = (val: number | undefined | null): number => Math.max(0, val || 0);

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
     * Calculates the Dashboard Summary from a list of Domain Agencies
     * Now includes netProfit and bankReserves directly (Option 1)
     */
    calculateSummary: (agencies: Agency[]): DashboardSummary => {
        const rawSummary = agencies.reduce((acc, curr) => ({
            totalCollected: acc.totalCollected + curr.totalCollected,
            netCollected: acc.netCollected + curr.netCollected,
            totalPremiums: acc.totalPremiums + curr.premiumsPaid,
            totalCommissions: acc.totalCommissions + curr.commissions,
            activeAgencies: acc.activeAgencies + (curr.totalCollected > 0 ? 1 : 0)
        }), {
            totalCollected: 0,
            netCollected: 0,
            totalPremiums: 0,
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
    }
};
