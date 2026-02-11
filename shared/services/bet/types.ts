export interface CreateBetDTO {
    draw?: number;
    game_type?: number;
    numbers_played?: any;
    amount?: number;
    owner_structure?: number;
    drawId?: string;
    centenas?: any[];
    fijosCorridos?: any[];
    parlets?: any[];
    loteria?: any[];
    receiptCode?: string;
}

export interface BackendBet {
    id: number | string;
    draw: number | string;
    game_type?: number | string;
    bet_type?: number | string;
    numbers_played: any;
    amount: string | number;
    created_at: string;
    is_winner: boolean;
    payout_amount: string | number;
    owner_structure: number | string;
    receipt_code?: string;
    draw_details?: {
        id: number | string;
        name: string;
        description?: string;
    };
    game_type_details?: {
        id: number | string;
        name: string;
    };
    bet_type_details?: {
        id: number | string;
        name: string;
        code?: string;
    };
}

export interface ListBetsFilters {
    drawId?: string;
    limit?: number;
    offset?: number;
}
