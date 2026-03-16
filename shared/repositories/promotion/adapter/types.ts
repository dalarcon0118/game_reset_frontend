export interface PromotionResponse {
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
}
