export interface BackendHealthMetrics {
    solvency_ratio: number;
    trend_percentage?: number;
    trend?: number;
    risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    risk_score?: number;
    status?: 'healthy' | 'warning' | 'critical';
    net_result?: number;
    total_pending_prizes: number;
}

export interface BackendDashboardSummary {
    id_estructura: number;
    nombre_estructura: string;
    padre_id: number | null;
    totalCollected: number;
    totalPaid: number;
    totalPending: number;
    netTotal: number;
    health_metrics: BackendHealthMetrics;
    sorteos: any[];
}

export interface BackendChildStructure {
    id: number;
    name: string;
    type: string;
    structure_id?: number | null;
    total_collected?: number | null;
    net_collected?: number | null;
    premiums_paid?: number | null;
    commissions?: number | null;
    draw_name?: string | null;
    draw_ids?: number[] | null;
}

export interface BackendListeroDrawDetail {
    draw_id: number;
    draw_name: string;
    draw_type_code?: string;
    draw_type_name?: string;
    draw_type_extra_data?: Record<string, unknown> | null;
    status: string;
    winning_number: string | null;
    opening_time: string;
    closing_time: string;
    total_collected: number;
    total_paid: number;
    net_result: number;
    commissions: number;
    status_closed?: 'success' | 'reported' | null;
}

export interface BackendListeroDetails {
    listero_name: string;
    draws: BackendListeroDrawDetail[];
}

// Re-exporting for compatibility
export type ChildStructure = BackendChildStructure;
export type ListeroDrawDetail = BackendListeroDrawDetail;
export type ListeroDetails = BackendListeroDetails;
