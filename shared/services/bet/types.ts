export interface GenericBetItemDTO {
    betTypeId: number | string;
    drawId?: number | string;
    amount: number;
    numbers: string | number | number[] | Record<string, any>;
    localId?: string;
}

export interface CreateBetDTO {
    drawId: string | number;
    bets?: GenericBetItemDTO[];
    receiptCode?: string;
    // Legacy fields for backward compatibility
    draw?: number;
    game_type?: number;
    numbers_played?: any;
    amount?: number;
    owner_structure?: number;
    centenas?: any[];
    fijosCorridos?: any[];
    parlets?: any[];
    loteria?: any[];
    betTypeid?: number | string; // Campo para ID dinámico del backend
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
    receiptCode?: string;
    limit?: number;
    offset?: number;
}
