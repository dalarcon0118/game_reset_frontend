import { BetType } from '@/types';
import NetInfo from '@react-native-community/netinfo';
import { BetApi } from './bet/api';
import { BetOffline } from './bet/offline';
import { mapBackendBetToFrontend } from './bet/mapper';
import { sanitizeCreateBetData } from './bet/sanitizer';
import { CreateBetDTO, ListBetsFilters } from './bet/types';

export type { CreateBetDTO } from './bet/types';

export class BetService {

    /**
     * Create a new bet
     * @param betData - The bet data to send to the backend
     * @returns Promise with the created BetType or BetType[]
     */
    static async create(betData: CreateBetDTO): Promise<BetType | BetType[]> {
        console.log('[BetService.create] Creating bet with data:', JSON.stringify(betData, null, 2));

        const state = await NetInfo.fetch();
        const isOnline = state.isConnected && state.isInternetReachable !== false;
        console.log('[BetService.create] Network state:', { isConnected: state.isConnected, isInternetReachable: state.isInternetReachable, isOnline });

        const sanitizedData = sanitizeCreateBetData(betData);

        console.log('[BetService.create] Saving to offline storage (Optimistic)...');
        const offlineId = await BetOffline.savePendingBet(sanitizedData);
        const pendingBet = BetOffline.buildPendingBet(sanitizedData, offlineId);

        if (!isOnline) {
            console.log('[BetService.create] Offline mode. Returning pending bet.');
            return pendingBet;
        }

        try {
            const response = await BetApi.create(sanitizedData);
            console.log('[BetService.create] API response received:', JSON.stringify(response, null, 2));

            await BetOffline.removePendingBet(offlineId);

            if (Array.isArray(response)) {
                if (response.length === 0) {
                    throw new Error('No se crearon apuestas. El servidor no devolvió datos de confirmación.');
                }
                return response.map(bet => mapBackendBetToFrontend(bet));
            }
            return mapBackendBetToFrontend(response);
        } catch (error: any) {
            console.error('[BetService.create] API call failed:', error);

            // Check if it's a client error (4xx) or server/network error
            const status = error?.status || error?.response?.status;
            const isClientError = status >= 400 && status < 500;

            if (isClientError) {
                console.log('[BetService.create] Client error (Invalid Data). Removing from offline storage.');
                await BetOffline.removePendingBet(offlineId);
                throw error;
            } else {
                console.log('[BetService.create] Network/Server error. Keeping bet in offline storage.');
                return pendingBet;
            }
        }
    }

    /**
     * Get all bets from backend
     * @param filters - Optional filters (e.g., drawId, limit, offset)
     * @returns Promise with array of BetType
     */
    static async list(filters?: ListBetsFilters): Promise<BetType[]> {
        let onlineBets: BetType[] = [];
        let offlineBets: BetType[] = [];

        console.log('[BetService.list] Starting with filters:', filters);

        try {
            const pendingBets = await BetOffline.getPendingBets();
            console.log('[BetService.list] Raw pending bets from offline:', pendingBets?.length || 0);
            offlineBets = BetOffline.flattenPendingBets(pendingBets, { drawId: filters?.drawId });
            console.log(`[BetService.list] Flattened into ${offlineBets.length} pending bets.`);
        } catch (e) {
            console.warn('[BetService.list] Error fetching offline bets:', e);
        }

        try {
            console.log('[BetService.list] Calling BetApi.list with filters:', JSON.stringify(filters));
            const response = await BetApi.list(filters);
            console.log('[BetService.list] Response received from BetApi.list');

            if (!Array.isArray(response)) {
                console.warn('[BetService.list] Unexpected response format (not an array):', typeof response);
            } else {
                console.log(`[BetService.list] API returned ${response.length} bets`);
                onlineBets = response.map(bet => {
                    try {
                        return mapBackendBetToFrontend(bet);
                    } catch (mapError) {
                        console.error('[BetService.list] Error mapping individual bet:', mapError, bet);
                        return null;
                    }
                }).filter(Boolean) as BetType[];
                console.log(`[BetService.list] Successfully mapped ${onlineBets.length} online bets`);
            }
        } catch (error) {
            console.error('[BetService.list] Error fetching bets from API:', error);
        }

        const totalBets = [...offlineBets, ...onlineBets];
        console.log(`[BetService.list] Returning total of ${totalBets.length} bets (${offlineBets.length} offline + ${onlineBets.length} online)`);
        return totalBets;
    }

    static async filterBetsTypeByDrawId(drawId: string): Promise<BetType[]> {
        const response = await BetApi.listByDrawId(drawId);
        if (!Array.isArray(response)) return [];
        return response.map(bet => mapBackendBetToFrontend(bet));
    }
}
