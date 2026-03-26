export interface BackendChildStructure {
    id: number;
    structure_id: number;
    name: string;
    type: string;
    total_collected: number;
    net_collected: number;
    premiums_paid: number;
    commissions: number;
    draw_name: string;
    draw_ids: number[];
}

export interface BackendListeroDrawDetail {
    draw_id: number;
    draw_name: string;
    draw_type_code?: string;
    draw_type_name?: string;
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
