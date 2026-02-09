import { BetType } from '@/types';
import apiClient from '@/shared/services/api_client';
import settings from '@/config/settings';
import NetInfo from '@react-native-community/netinfo';
import { OfflineStorage } from './offline_storage';

// DTO for creating a new bet
export interface CreateBetDTO {
    draw?: number;           // ID del sorteo
    game_type?: number;      // ID del tipo de juego
    numbers_played?: any;    // JSON con los números (array o objeto según el juego)
    amount?: number;         // Monto de la apuesta
    owner_structure?: number;// ID de la estructura del listero

    // New bulk payload structure
    drawId?: string;
    centenas?: any[];
    fijosCorridos?: any[];
    parlets?: any[];
    loteria?: any[];
    receiptCode?: string;
}

// Backend response interface matching BetSerializer
interface BackendBet {
    id: number;
    draw: number;
    game_type?: number;
    bet_type?: number;
    numbers_played: any;
    amount: string;
    created_at: string;
    is_winner: boolean;
    payout_amount: string;
    owner_structure: number;
    receipt_code?: string;

    draw_details?: {
        id: number;
        name: string;
        description?: string;
    };
    game_type_details?: {
        id: number;
        name: string;
    };
    bet_type_details?: {
        id: number;
        name: string;
        code?: string;
    };
}

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

        // Sanitize payload: Remove 0 amounts to prevent backend validation errors
        // Backend expects null/undefined for "no bet", but 0 triggers "must be > 0" error.
        const sanitizedData = { ...betData };
        if (sanitizedData.fijosCorridos) {
            sanitizedData.fijosCorridos = sanitizedData.fijosCorridos.map(item => {
                const sanitizedItem: any = { ...item };
                if (sanitizedItem.fijoAmount !== undefined && sanitizedItem.fijoAmount <= 0) {
                    sanitizedItem.fijoAmount = undefined;
                }
                if (sanitizedItem.corridoAmount !== undefined && sanitizedItem.corridoAmount <= 0) {
                    sanitizedItem.corridoAmount = undefined;
                }
                return sanitizedItem;
            });
        }

        // ALWAYS Save locally first (Optimistic/Offline-First)
        console.log('[BetService.create] Saving to offline storage (Optimistic)...');
        const offlineId = await OfflineStorage.savePendingBet(sanitizedData);

        // Construct pending bet object for UI
        const pendingBet: BetType = {
            id: `offline-${offlineId}`,
            type: 'Fijo', // Placeholder
            numbers: JSON.stringify(sanitizedData.numbers_played || []),
            amount: sanitizedData.amount || 0,
            draw: (sanitizedData.draw || sanitizedData.drawId || '').toString(),
            createdAt: new Date().toLocaleTimeString(),
            isPending: true
        };

        if (!isOnline) {
            console.log('[BetService.create] Offline mode. Returning pending bet.');
            return pendingBet;
        }

        try {
            console.log('[BetService.create] Making API call to:', settings.api.endpoints.bets());
            const response = await apiClient.post<BackendBet | BackendBet[]>(settings.api.endpoints.bets(), sanitizedData);
            console.log('[BetService.create] API response received:', JSON.stringify(response, null, 2));

            // Success: Remove from offline storage
            await OfflineStorage.removePendingBet(offlineId);

            if (Array.isArray(response)) {
                if (response.length === 0) {
                    throw new Error('No se crearon apuestas. El servidor no devolvió datos de confirmación.');
                }
                return response.map(bet => BetService.mapBackendBetToFrontend(bet));
            } else {
                return BetService.mapBackendBetToFrontend(response);
            }
        } catch (error: any) {
            console.error('[BetService.create] API call failed:', error);

            // Check if it's a client error (4xx) or server/network error
            const status = error?.status || error?.response?.status;
            const isClientError = status >= 400 && status < 500;

            if (isClientError) {
                // Invalid data - remove from offline storage and throw error
                console.log('[BetService.create] Client error (Invalid Data). Removing from offline storage.');
                await OfflineStorage.removePendingBet(offlineId);
                throw error;
            } else {
                // Network/Server error - Keep in offline storage and return pending bet
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
    static async list(filters?: { drawId?: string; limit?: number; offset?: number }): Promise<BetType[]> {
        let onlineBets: BetType[] = [];
        let offlineBets: BetType[] = [];

        // 1. Fetch Pending Bets (Offline)
        try {
            const pendingBets = await OfflineStorage.getPendingBets();
            const relevantPendingBets = filters?.drawId
                ? pendingBets.filter(pb => (pb.draw || pb.drawId)?.toString() === filters.drawId)
                : pendingBets;

            offlineBets = relevantPendingBets.map(pb => ({
                id: `offline-${pb.offlineId}`,
                type: 'Fijo', // Simplified placeholder, logic in transformer will handle specifics if structure matches
                numbers: JSON.stringify(pb.numbers_played || []),
                amount: pb.amount || 0,
                draw: (pb.draw || pb.drawId || '').toString(),
                createdAt: new Date(pb.timestamp).toLocaleTimeString(),
                isPending: true
            }));
            console.log(`[BetService.list] Found ${offlineBets.length} pending bets locally.`);
        } catch (e) {
            console.warn('[BetService.list] Error fetching offline bets:', e);
        }

        // 2. Fetch Server Bets
        try {
            const params = new URLSearchParams();
            if (filters?.drawId) {
                params.append('draw', filters.drawId);
            }
            if (filters?.limit) {
                params.append('limit', filters.limit.toString());
            }
            if (filters?.offset) {
                params.append('offset', filters.offset.toString());
            }

            const endpoint = `${settings.api.endpoints.bets()}${params.toString() ? `?${params.toString()}` : ''}`;
            console.info(`[BetService -> list] ${endpoint}`)
            const response = await apiClient.get<BackendBet[]>(endpoint);
            console.log('Raw response from bets API:', JSON.stringify(response));

            // NOTE: ApiClient already extracts .results if it detects a paginated response
            if (!Array.isArray(response)) {
                console.warn('Unexpected response format from bets API:', response);
            } else {
                onlineBets = response.map(bet => BetService.mapBackendBetToFrontend(bet));
            }
        } catch (error) {
            console.error('Error fetching bets:', error);
            // Continue to return offline bets if server fails
        }

        return [...offlineBets, ...onlineBets];
    }

    // Map backend bet to frontend BetType
    private static mapBackendBetToFrontend(backendBet: BackendBet): BetType {
        try {
            console.log('Mapping backend bet:', backendBet);
            return {
                id: (backendBet.id || backendBet.receipt_code || Math.random().toString(36).substring(7)).toString(),
                type: (backendBet.game_type_details?.name || backendBet.bet_type_details?.name || 'Unknown') as 'Fijo' | 'Parlet' | 'Corrido',
                numbers: JSON.stringify(backendBet.numbers_played),
                amount: backendBet.amount ? parseFloat(backendBet.amount) : 0,
                draw: backendBet.draw?.toString() || '',
                createdAt: backendBet.created_at ? new Date(backendBet.created_at).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                }) : new Date().toLocaleTimeString(),
                receiptCode: backendBet.receipt_code || '-----'
            };
        } catch (error) {
            console.error('Error mapping bet:', error, backendBet);
            throw error;
        }
    }

    static async filterBetsTypeByDrawId(drawId: string): Promise<BetType[]> {
        const response = await apiClient.get<BackendBet[]>(`${settings.api.endpoints.bets()}draw/${drawId}`);
        if (!Array.isArray(response)) return [];
        return response.map(bet => BetService.mapBackendBetToFrontend(bet));
    }
}
