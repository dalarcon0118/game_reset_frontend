import { RemoteData } from '@/shared/core/tea-utils/remote.data';
import { Model } from './model';

export const initialState: Model = {
    draws: RemoteData.notAsked(),
    filteredDraws: [],
    summary: RemoteData.notAsked(),
    pendingBets: [],
    syncedBets: [],
    dailyTotals: {
        totalCollected: 0,
        premiumsPaid: 0,
        netResult: 0,
        estimatedCommission: 0,
        amountToRemit: 0,
    },
    userStructureId: null,
    statusFilter: 'open',
    appliedFilter: 'open',
    commissionRate: 0, // Inicia en 0, se carga desde el perfil del usuario
    showBalance: true,
    authToken: null,
    currentUser: null,
    isRateLimited: false,
};
