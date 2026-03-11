export interface PromotionResponse {
    id: number;
    title: string;
    description: string;
    image_url: string;
    promotion_type: 'LOTTERY_PAYOUT' | 'BONUS' | 'EVENT' | 'INFO';
    priority: number;
    structure: number | null;
}
