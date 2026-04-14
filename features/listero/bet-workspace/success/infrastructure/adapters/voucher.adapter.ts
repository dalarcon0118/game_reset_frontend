import { VoucherPort, VoucherSourceData } from '../../core/domain/success.ports';
import { drawRepository } from '@/shared/repositories/draw';
import { betRepository } from '@/shared/repositories/bet/bet.repository';
import { SharingService } from '@/shared/services/sharing';
import { logger } from '@/shared/utils/logger';
import { SuccessImpl } from '../../core/domain/success.impl';

const log = logger.withTag('VOUCHER_ADAPTER');

export const VoucherAdapter: VoucherPort = {
    fetchSourceData: async (params: { drawId?: string; receiptCode?: string }): Promise<VoucherSourceData> => {
        const { drawId, receiptCode } = params;

        log.info('📡 Fetching source data via Repositories', { drawId, receiptCode });

        if (!drawId || !receiptCode) {
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

        if (drawRes && drawRes.isOk() && drawRes.value) {
            log.info('📊 Draw data received in adapter:', {
                drawId: drawRes.value.id,
                drawName: drawRes.value.name
            });
        } else {
            log.warn('⚠️ No draw data available');
        }

        if (betsRes.isErr()) {
            log.error('❌ Error loading bets from repository', betsRes.error);
        }

        const bets = betsRes.isOk() ? (betsRes.value || []) : [];

        // DEBUG: Log detallado de las apuestas recibidas
        log.info('📊 Bets received from repository:', {
            count: bets.length,
            betsSummary: bets.map((b, i) => ({
                index: i,
                id: b.id,
                receiptCode: b.receiptCode,
                type: b.type,
                amount: b.amount,
                hasFingerprint: !!(b as any).fingerprint,
                hasFingerprintData: !!(b as any).fingerprint_data,
                fingerprintKeys: (b as any).fingerprint ? Object.keys((b as any).fingerprint) : [],
                fingerprintDataKeys: (b as any).fingerprint_data ? Object.keys((b as any).fingerprint_data) : [],
                allKeys: Object.keys(b)
            }))
        });

        if (bets.length > 0) {
            const firstBet = bets[0];
            log.info('🔍 [FINGERPRINT_DEBUG] First bet detailed analysis:', {
                id: firstBet.id,
                receiptCode: firstBet.receiptCode,
                type: firstBet.type,
                amount: firstBet.amount,
                'fingerprint': (firstBet as any).fingerprint,
                'fingerprint_data': (firstBet as any).fingerprint_data,
                'fingerprint_data?.hash': (firstBet as any).fingerprint_data?.hash,
                'fingerprint?.hash': (firstBet as any).fingerprint?.hash,
                'fingerprintData?.total_sales': (firstBet as any).fingerprint_data?.total_sales,
                'fingerprint?.total_sales': (firstBet as any).fingerprint?.total_sales
            });
        }

        // Enrich bets with rewards from BetType (SSOT)
        const betTypes = betTypesRes && betTypesRes.isOk() ? betTypesRes.value : [];
        const enrichedRewards = SuccessImpl.enrichBetsWithRewards(bets, betTypes);

        return {
            draw: drawRes && drawRes.isOk() ? drawRes.value : null,
            bets,
            rewards: enrichedRewards
        };
    },

    shareVoucher: async (uri: string): Promise<boolean> => {
        log.info('📤 Sharing voucher', { uri });
        return await SharingService.shareImage(uri);
    }
};
