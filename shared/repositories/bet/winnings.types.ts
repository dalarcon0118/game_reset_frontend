/**
 * Tipos para las apuestas ganadoras del usuario
 */

export interface WinningBet {
    id: number;
    draw: number;
    bet_type: number;
    numbers_played: string;
    amount: number;
    created_at: string;
    is_winner: boolean;
    payout_amount: number;
    receipt_code: string;
    draw_details?: {
        id: number;
        name: string;
        draw_datetime: string;
    };
    bet_type_details?: {
        id: number;
        name: string;
        code: string;
    };
    owner_structure_details?: {
        id: number;
        name: string;
    };
}

export interface PendingRewardsCount {
    pending_count: number;
}

export interface WinningBetSummary {
    totalWinnings: number;
    winningBets: WinningBet[];
    drawId?: string;
}
