import { BetType } from '@/types';
import apiClient from '@/shared/services/ApiClient';
import settings from '@/config/settings';
import NetInfo from '@react-native-community/netinfo';
import { OfflineStorage } from './OfflineStorage';

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
     * @returns Promise with the created BetType
     */
    static async create(betData: CreateBetDTO): Promise<BetType> {
        console.log('Creating bet with data:', betData);

        const state = await NetInfo.fetch();
        const isOnline = state.isConnected && state.isInternetReachable !== false;

        if (!isOnline) {
            console.log('Offline mode detected. Saving bet locally...');
            await OfflineStorage.savePendingBet(betData);

            // Retornamos un objeto BetType ficticio con estado pendiente
            return {
                id: `offline-${Math.random().toString(36).substring(7)}`,
                type: 'Fijo', // Valor por defecto para el placeholder
                numbers: JSON.stringify(betData.numbers_played || []),
                amount: betData.amount || 0,
                draw: (betData.draw || betData.drawId || '').toString(),
                createdAt: new Date().toLocaleTimeString(),
                isPending: true // Nuevo campo opcional para la UI
            };
        }

        const response = await apiClient.post<BackendBet[]>(settings.api.endpoints.bets(), betData);

        // Si el backend devuelve un array, tomamos el primer elemento
        if (Array.isArray(response) && response.length > 0) {
            console.log('Taking first element from array response');
            return BetService.mapBackendBetToFrontend(response[0]);
        } else if (!Array.isArray(response)) {
            // Si es un solo objeto, lo mapeamos directamente
            return BetService.mapBackendBetToFrontend(response);
        } else {
            // Si es un array vacío o algo inesperado, lanzamos error
            throw new Error('Invalid response format from backend');
        }
    }

    /**
     * Get all bets from backend
     * @param filters - Optional filters (e.g., drawId)
     * @returns Promise with array of BetType
     */
    static async list(filters?: { drawId?: string }): Promise<BetType[]> {
        try {
            const params = new URLSearchParams();
            if (filters?.drawId) {
                params.append('draw', filters.drawId);
            }

            const endpoint = `${settings.api.endpoints.bets()}${params.toString() ? `?${params.toString()}` : ''}`;
            console.info(`[BetService -> list] ${endpoint}`)
            const response = await apiClient.get<BackendBet[]>(endpoint);
            console.log('Raw response from bets API:', JSON.stringify(response));
            if (!Array.isArray(response)) {
                console.warn('Unexpected response format from bets API:', response);
                return [];
            }

            return response.map(bet => BetService.mapBackendBetToFrontend(bet));
        } catch (error) {
            console.error('Error fetching bets:', error);
            return [];
        }
    }

    // Map backend bet to frontend BetType
    private static mapBackendBetToFrontend(backendBet: BackendBet): BetType {
        try {
            console.log('Mapping backend bet:', backendBet);
            return {
                id: backendBet.id?.toString() || '',
                type: (backendBet.game_type_details?.name || backendBet.bet_type_details?.name || 'Unknown') as 'Fijo' | 'Parlet' | 'Corrido',
                numbers: JSON.stringify(backendBet.numbers_played),
                amount: backendBet.amount ? parseFloat(backendBet.amount) : 0,
                draw: backendBet.draw?.toString() || '',
                createdAt: backendBet.created_at ? new Date(backendBet.created_at).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                }) : new Date().toLocaleTimeString()
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
