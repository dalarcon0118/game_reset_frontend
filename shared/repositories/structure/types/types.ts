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
