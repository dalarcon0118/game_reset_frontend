import { WebData } from '@core/tea-utils';

export interface Promotion {
    id: number;
    title: string;
    subtitle?: string;
    description: string;
    image_url?: string;
    promotion_type: 'LOTTERY_PAYOUT' | 'BONUS' | 'EVENT' | 'INFO';
    priority: number;
    structure: number | null;
    style_config?: {
        bg?: string;
        text?: string;
        gradient?: string[];
        button_color?: string;
    };
    // Link to games for navigation
    draw_type?: number;
    bet_type?: number;
    draw_type_code?: string;
    bet_type_code?: string;
}

export interface PromotionState {
    promotions: WebData<Promotion[]>;
    showPromotionsModal: boolean;
    hasBeenShown: boolean;
}
