export interface SlotSymbol {
    id: number;
    name: string;
    image_url: string | null;
    weight: number;
    base_value: string;
}

export interface SlotPayline {
    id: number;
    name: string;
    coordinates: number[];
    is_active: boolean;
}

export interface SlotMachine {
    id: number;
    name: string;
    description: string;
    rows: number;
    reels: number;
    min_bet: string;
    max_bet: string;
    symbols: SlotSymbol[];
    paylines: SlotPayline[];
}

export interface SlotSpinResult {
    spin_id: number;
    result: { id: number; name: string; base_value: string }[][];
    win_amount: number;
    is_winner: boolean;
    bet_amount: number;
}

export interface SpinRequest {
    machine_id: number;
    amount: number;
}
