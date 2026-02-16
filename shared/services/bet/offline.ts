import { BetType } from '@/types';
import { OfflineStorage, PendingBet } from '../offline_storage';
import { CreateBetDTO, ListBetsFilters } from './types';

const buildPendingBet = (betData: CreateBetDTO, offlineId: string): BetType => {
    return {
        id: `offline-${offlineId}`,
        type: 'Fijo',
        numbers: JSON.stringify(betData.numbers_played || []),
        amount: betData.amount || 0,
        draw: (betData.draw || betData.drawId || '').toString(),
        createdAt: new Date().toLocaleTimeString(),
        isPending: true
    };
};

const flattenPendingBets = (pendingBets: PendingBet[], filters?: Pick<ListBetsFilters, 'drawId'>): BetType[] => {
    const relevantPendingBets = filters?.drawId
        ? pendingBets.filter(pb => (pb.draw || pb.drawId)?.toString() === filters.drawId)
        : pendingBets;

    const offlineBets: BetType[] = [];

    relevantPendingBets.forEach(pb => {
        const drawId = (pb.draw || pb.drawId || '').toString();
        const createdAt = new Date(pb.timestamp).toLocaleTimeString();
        const receiptCode = pb.receiptCode || 'P-OFFLINE';

        if (pb.amount && pb.numbers_played) {
            offlineBets.push({
                id: `offline-${pb.offlineId}`,
                type: 'Fijo',
                numbers: JSON.stringify(pb.numbers_played),
                amount: pb.amount,
                draw: drawId,
                createdAt,
                isPending: true,
                receiptCode
            });
        }

        if (pb.fijosCorridos && Array.isArray(pb.fijosCorridos)) {
            pb.fijosCorridos.forEach((item, idx) => {
                if (item.fijoAmount) {
                    offlineBets.push({
                        id: `offline-${pb.offlineId}-fijo-${idx}`,
                        type: 'Fijo',
                        numbers: JSON.stringify({ number: item.bet }),
                        amount: item.fijoAmount,
                        draw: drawId,
                        createdAt,
                        isPending: true,
                        receiptCode
                    });
                }
                if (item.corridoAmount) {
                    offlineBets.push({
                        id: `offline-${pb.offlineId}-corrido-${idx}`,
                        type: 'Corrido',
                        numbers: JSON.stringify({ number: item.bet }),
                        amount: item.corridoAmount,
                        draw: drawId,
                        createdAt,
                        isPending: true,
                        receiptCode
                    });
                }
            });
        }

        if (pb.parlets && Array.isArray(pb.parlets)) {
            pb.parlets.forEach((item, idx) => {
                offlineBets.push({
                    id: `offline-${pb.offlineId}-parlet-${idx}`,
                    type: 'Parlet',
                    numbers: JSON.stringify({ numbers: item.bets }),
                    amount: item.amount,
                    draw: drawId,
                    createdAt,
                    isPending: true,
                    receiptCode
                });
            });
        }

        if (pb.centenas && Array.isArray(pb.centenas)) {
            pb.centenas.forEach((item, idx) => {
                offlineBets.push({
                    id: `offline-${pb.offlineId}-centena-${idx}`,
                    type: 'Centena' as any,
                    numbers: JSON.stringify({ number: item.bet }),
                    amount: item.amount,
                    draw: drawId,
                    createdAt,
                    isPending: true,
                    receiptCode
                });
            });
        }

        if (pb.loteria && Array.isArray(pb.loteria)) {
            pb.loteria.forEach((item, idx) => {
                offlineBets.push({
                    id: `offline-${pb.offlineId}-loteria-${idx}`,
                    type: 'Loteria' as any,
                    numbers: JSON.stringify({ bet: item.bet }),
                    amount: item.amount,
                    draw: drawId,
                    createdAt,
                    isPending: true,
                    receiptCode
                });
            });
        }
    });

    return offlineBets;
};

export const BetOffline = {
    savePendingBet: OfflineStorage.savePendingBet.bind(OfflineStorage),
    removePendingBet: OfflineStorage.removePendingBet.bind(OfflineStorage),
    getPendingBets: OfflineStorage.getPendingBets.bind(OfflineStorage),
    markAsSynced: OfflineStorage.markAsSynced.bind(OfflineStorage),
    markAsError: OfflineStorage.markAsError.bind(OfflineStorage),
    cleanupSyncedBets: OfflineStorage.cleanupSyncedBets.bind(OfflineStorage),
    buildPendingBet,
    flattenPendingBets
};
