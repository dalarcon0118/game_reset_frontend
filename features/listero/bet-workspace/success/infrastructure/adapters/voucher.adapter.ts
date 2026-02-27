import { VoucherPort, VoucherSourceData } from '../../core/domain/success.ports';
import { DrawRepository } from '@/shared/repositories/draw.repository';
import { betRepository } from '@/shared/repositories/bet/bet.repository';
import { SharingService } from '@/shared/services/sharing';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('VOUCHER_ADAPTER');

export const VoucherAdapter: VoucherPort = {
    fetchSourceData: async (params: { drawId?: string; receiptCode?: string }): Promise<VoucherSourceData> => {
        const { drawId, receiptCode } = params;

        log.info('📡 Fetching source data via Repositories', { drawId, receiptCode });

        if (!drawId && !receiptCode) {
            throw new Error('Missing identification for voucher');
        }

        const [drawRes, betsRes, betTypesRes] = await Promise.all([
            drawId ? DrawRepository.getDraw(drawId) : Promise.resolve(null),
            betRepository.getBets(receiptCode ? { receiptCode } : { drawId }),
            drawId ? DrawRepository.getBetTypes(drawId) : Promise.resolve(null)
        ]);

        if (drawRes && drawRes.isErr()) {
            log.error('❌ Error loading draw details', drawRes.error);
            throw new Error('Error loading draw details');
        }

        if (betsRes.isErr()) {
            log.error('❌ Error loading bets', betsRes.error);
            throw new Error('Error loading bets');
        }

        return {
            draw: drawRes ? drawRes.value : null,
            bets: betsRes.value || [],
            betTypes: betTypesRes && betTypesRes.isOk() ? betTypesRes.value : []
        };
    },

    shareVoucher: async (uri: string): Promise<boolean> => {
        log.info('📤 Sharing voucher', { uri });
        return await SharingService.shareImage(uri);
    }
};
