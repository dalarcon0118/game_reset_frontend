import { ExtendedDrawType } from '@/shared/services/draw';
import { BetType } from '@/types';

export interface VoucherSourceData {
    draw: ExtendedDrawType | null;
    bets: BetType[];
    betTypes?: any[]; // Cached bet types for dynamic hydration
}

export interface VoucherPort {
    /**
     * Fetches raw data from multiple sources (Draws and Bets)
     */
    fetchSourceData(params: { drawId?: string; receiptCode?: string }): Promise<VoucherSourceData>;

    /**
     * Shares the voucher image
     */
    shareVoucher(uri: string): Promise<boolean>;
}
