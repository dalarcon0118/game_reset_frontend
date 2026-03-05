export interface GenericBetItemDTO {
    betTypeId: number | string;
    drawId: number | string;
    amount: number;
    numbers: string | number | number[] | Record<string, any>;
    external_id?: string;
    owner_structure?: number | string;
}

export interface CreateBetDTO {
    drawId: string | number;
    bets: GenericBetItemDTO[];
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
    external_id?: string;
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
    receiptCode?: string;
    date?: string; // Formato YYYY-MM-DD
    limit?: number;
    offset?: number;
}
