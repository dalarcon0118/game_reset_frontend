/**
 * Core Structure Domain Models (TEA Architecture)
 * Represents the pure business logic entities, decoupled from Backend/API details.
 */

export type StructureNodeType = 'banker' | 'listero' | 'colector' | 'agency';

/**
 * Base node for any structural entity
 */
export interface StructureNode {
    id: number;
    name: string;
    type: StructureNodeType;
}

/**
 * Banker-specific view of a child node (Financial focus)
 */
export interface Agency extends StructureNode {
    totalCollected: number;
    netCollected: number;
    premiumsPaid: number;
    commissions: number;
    drawName: string;
    drawIds: number[];
}

/**
 * Listero-specific view of a child node (Operational focus)
 */
export interface ListeroNode extends StructureNode {
    // Future extension: status, last_bet, etc.
}

/**
 * Summary for the Banker Dashboard
 */
export interface DashboardSummary {
    totalCollected: number;
    netCollected: number;
    totalPremiums: number;
    totalCommissions: number;
    netProfit: number;
    bankReserves: number;
    activeAgencies: number;
}
