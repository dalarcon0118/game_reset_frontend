import { StructureService, ChildStructure } from '@/shared/services/Structure';

export interface DashboardSummary {
    totalCollected: number;
    netProfit: number;
    commissionsPaid: number;
    bankReserves: number;
}

export interface BankerDashboardData {
    children: ChildStructure[];
    summary: DashboardSummary;
}

export class BankerDashboardService {
    /**
     * Get dashboard data including children structures and calculated summary stats
     * @param bankerId - ID of the banker structure
     * @returns Promise with children and summary
     */
    static async getDashboardData(bankerId: number): Promise<{ children: ChildStructure[], summary: DashboardSummary }> {
        try {
            // Fetch immediate children (level 1 relative to banker)
            // Reusing StructureService as requested
            const children = await StructureService.getChildren(bankerId);

            // Calculate summary stats from children data
            const summary = BankerDashboardService.calculateSummary(children);

            return { children, summary };
        } catch (error) {
            console.error('Error fetching banker dashboard data:', error);
            // Return empty data on error to prevent UI crash
            return {
                children: [],
                summary: {
                    totalCollected: 0,
                    netProfit: 0,
                    commissionsPaid: 0,
                    bankReserves: 0
                }
            };
        }
    }

    /**
     * Calculate summary statistics from a list of child structures
     */
    private static calculateSummary(children: ChildStructure[]): DashboardSummary {
        if (!children || children.length === 0) {
            return {
                totalCollected: 0,
                netProfit: 0,
                commissionsPaid: 0,
                bankReserves: 0
            };
        }

        const totalCollected = children.reduce((sum, child) => sum + (child.total_collected || 0), 0);
        // net_collected in ChildStructure comes from backend as (collected - paid)
        const netProfit = children.reduce((sum, child) => sum + (child.net_collected || 0), 0);
        const commissionsPaid = children.reduce((sum, child) => sum + (child.commissions || 0), 0);
        const premiumsPaid = children.reduce((sum, child) => sum + (child.premiums_paid || 0), 0);

        // Bank Reserves logic: Net Profit (collected - paid) - Commissions
        // This represents what's actually left for the bank after paying prizes and commissions
        const bankReserves = netProfit - commissionsPaid;

        return {
            totalCollected,
            netProfit,
            commissionsPaid,
            bankReserves: Math.max(0, bankReserves) // Prevent negative reserves display if desired, or keep as is
        };
    }
}
