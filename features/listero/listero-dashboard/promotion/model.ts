import { WebData } from '@core/tea-utils';

export interface Promotion {
    id: number;
    title: string;
    description: string;
    image_url: string;
    promotion_type: 'LOTTERY_PAYOUT' | 'BONUS' | 'EVENT' | 'INFO';
    priority: number;
    structure: number | null;
}

export interface PromotionState {
    promotions: WebData<Promotion[]>;
    showPromotionsModal: boolean;
}
