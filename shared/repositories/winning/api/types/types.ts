export interface BackendWinningRecord {
    id: number;
    draw: number;
    winning_number: string;
    date: string;
    created_at: string;
    draw_details?: {
        id: number;
        name: string;
    };
}

export type WinningRecord = BackendWinningRecord;
