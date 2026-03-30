import { VoucherPort, VoucherSourceData } from '../../core/domain/success.ports';
import { drawRepository } from '@/shared/repositories/draw';
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
            drawId ? drawRepository.getDraw(drawId) : Promise.resolve(null),
            betRepository.getBets({ 
                receiptCode, 
                drawId, // Siempre incluir drawId para facilitar la búsqueda en caché local
                date: undefined // Desactivar filtro de fecha para el voucher por seguridad
            }),
            drawId ? drawRepository.getBetTypes(drawId) : Promise.resolve(null)
        ]);

        if (drawRes && drawRes.isErr()) {
            log.warn('⚠️ Error loading draw details, proceeding with empty draw data', drawRes.error);
        }

        if (betsRes.isErr()) {
            log.error('❌ Error loading bets from repository', betsRes.error);
        }

        return {
            draw: drawRes && drawRes.isOk() ? drawRes.value : null,
            bets: betsRes.isOk() ? (betsRes.value || []) : [],
            betTypes: betTypesRes && betTypesRes.isOk() ? betTypesRes.value : []
        };
    },

    shareVoucher: async (uri: string): Promise<boolean> => {
        log.info('📤 Sharing voucher', { uri });
        return await SharingService.shareImage(uri);
    }
};
