import { DrawType, GameType } from '@/types';
import { mockDraws } from '@/data/mockData';
import apiClient from '@/shared/services/ApiClient';
import settings from '@/config/settings';

// Simulate server response delay
const RESPONSE_DELAY = 500;

// Backend response type
interface BackendDraw {
  id: number;
  draw_type: number;  // ID del tipo de sorteo
  draw_type_details: {
    id: number;
    name: string;
    description: string;
  };
  total_collected: number;
  name: string;  // Nombre del sorteo (Miami, Florida, etc.)
  description: string | null;  // Descripción del sorteo
  draw_datetime: string;
  betting_start_time: string | null;
  betting_end_time: string | null;
  status: string;
  owner_structure: number;  // ID de la estructura
  winning_numbers: any | null; // WinningRecord object from backend
  created_at: string;
  updated_at: string;
}

export class DrawService {
  // Get a single draw by ID
  static async getOne(id: string): Promise<DrawType | null> {
    try {
      const response = await apiClient.get<BackendDraw>(`${settings.api.endpoints.draws}${id}/`);

      return {
        // Backend fields
        id: response.id.toString(),
        name: response.name,
        description: response.description,
        draw_datetime: response.draw_datetime,
        betting_start_time: response.betting_start_time,
        betting_end_time: response.betting_end_time,
        totalCollected: response.total_collected,
        status: DrawService.mapStatus(
          response.status,
          response.betting_start_time,
          response.betting_end_time
        ),
        draw_type: response.draw_type,
        owner_structure: response.owner_structure,
        winning_numbers: response.winning_numbers,
        created_at: response.created_at,
        updated_at: response.updated_at,

        // Computed UI fields for compatibility
        source: response.name,
        date: new Date(response.draw_datetime).toLocaleDateString('es-ES'),
        time: new Date(response.draw_datetime).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    } catch (error) {
      console.error('Error fetching draw:', error);
      return null;
    }
  }

  /**
   * Get all draws from backend
   * @param structureId - Optional ID of the structure (bank) to filter draws
   *                      Sent via X-Owner-Structure header
   * @returns Promise with array of DrawType (filtered by current date on backend)
   * @example
   * // Get all draws for a specific structure
   * const draws = await DrawService.list(10);
   * 
   * // Get all draws (no filter)
   * const allDraws = await DrawService.list();
   */
  static async list(structureId?: number): Promise<DrawType[]> {
    try {
      // Build query params (only for today filter)
      const params = new URLSearchParams();
      params.append('today', 'true');

      const endpoint = `${settings.api.endpoints.draws}?${params.toString()}`;

      // Build headers with owner_structure if provided
      const headers: Record<string, string> = {};
      if (structureId) {
        headers['X-Owner-Structure'] = structureId.toString();
      }

      const response = await apiClient.get<BackendDraw[]>(endpoint, { headers });


      // Map backend response to frontend DrawType with all fields
      return response.map(backendDraw => ({
        // Backend fields
        id: backendDraw.id.toString(),
        name: backendDraw.name,
        description: backendDraw.description,
        draw_datetime: backendDraw.draw_datetime,
        betting_start_time: backendDraw.betting_start_time,
        betting_end_time: backendDraw.betting_end_time,
        total_collected: backendDraw.total_collected,

        status: DrawService.mapStatus(
          backendDraw.status,
          backendDraw.betting_start_time,
          backendDraw.betting_end_time
        ),
        draw_type: backendDraw.draw_type,
        owner_structure: backendDraw.owner_structure,
        winning_numbers: backendDraw.winning_numbers,
        created_at: backendDraw.created_at,
        updated_at: backendDraw.updated_at,

        // Computed UI fields for compatibility
        source: backendDraw.name,
        date: new Date(backendDraw.draw_datetime).toLocaleDateString('es-ES'),
        time: new Date(backendDraw.draw_datetime).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        })
      }));
    } catch (error) {
      console.error('Error fetching draws:', error);
      // Fallback to mock data in case of error
      return mockDraws as unknown as DrawType[];
    }
  }

  // Map backend status to frontend status
  private static mapStatus(
    backendStatus: string,
    bettingStart: string | null,
    bettingEnd: string | null
  ): 'open' | 'pending' | 'closed' {
    if (backendStatus === 'completed' || backendStatus === 'cancelled') {
      return 'closed';
    }

    if (bettingStart && bettingEnd) {
      const now = new Date();
      const start = new Date(bettingStart);
      const end = new Date(bettingEnd);

      if (now >= start && now <= end) {
        return 'open';
      } else if (now < start) {
        return 'pending';
      } else {
        return 'closed';
      }
    }

    return backendStatus === 'scheduled' ? 'pending' : 'closed';
  }

  // Filter draws based on criteria
  static filter(criteria: {
    source?: string;
    time?: string;
    status?: 'active' | 'inactive';
  }): Promise<DrawType[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let filteredDraws = [...mockDraws];

        if (criteria.source) {
          filteredDraws = filteredDraws.filter(draw =>
            (draw.source || draw.name).toLowerCase().includes(criteria.source!.toLowerCase())
          );
        }

        if (criteria.time) {
          filteredDraws = filteredDraws.filter(draw =>
            draw.time && draw.time.toLowerCase().includes(criteria.time!.toLowerCase())
          );
        }

        if (criteria.status) {
          // Map 'active'/'inactive' to draw statuses
          if (criteria.status === 'active') {
            filteredDraws = filteredDraws.filter(draw =>
              draw.status === 'open' || draw.status === 'pending'
            );
          } else {
            filteredDraws = filteredDraws.filter(draw =>
              draw.status === 'closed'
            );
          }
        }

        resolve(filteredDraws);
      }, RESPONSE_DELAY);
    });
  }

  static async filterBetsTypeByDrawId(drawId: string): Promise<GameType[]> {
    const response = await apiClient.get<any[]>(`${settings.api.endpoints.draws}${drawId}/bet-types/`);
    console.info(`[Bettype for drawId: ${drawId}]`, JSON.stringify(response));
    return response.map(t => ({
      id: t.id.toString(),
      name: t.name,
      code: t.code,
      description: t.description
    }));
  }

  /**
   * Get all rules (validation and reward) for a draw
   * Uses JWT token to automatically get rules for the authenticated user's structure
   * @param drawId - ID of the draw
   * @returns Promise with validation and reward rules
   */
  static async getRulesForDraw(drawId: string): Promise<{
    validation_rules: any[];
    reward_rules: any[];
    structure_id: number;
    draw_id: number;
    draw_name: string;
    structure_name: string;
  } | null> {
    try {
      const response = await apiClient.get<any>(
        `${settings.api.endpoints.draws}${drawId}/rules-for-current-user/`
      );
      console.info(`[Rules for drawId: ${drawId}]`, JSON.stringify(response));
      return response;
    } catch (error) {
      console.error('Error fetching rules for draw:', error);
      return null;
    }
  }

  /**
   * Add winning numbers to a draw
   * @param drawId - ID of the draw
   * @param data - Winning number data
   * @returns Promise with created winning record
   */
  static async addWinningNumbers(
    drawId: string,
    data: { winning_number: string; date: string }
  ): Promise<{
    id: number;
    draw_id: number;
    draw_name: string;
    winning_number: string;
    date: string;
    created_at: string;
  } | null> {
    try {
      const response = await apiClient.post<any>(
        `${settings.api.endpoints.draws}${drawId}/add-winning-numbers/`,
        data
      );
      console.info(`[Winning numbers added for drawId: ${drawId}]`, JSON.stringify(response));
      return response;
    } catch (error) {
      console.error('Error adding winning numbers:', error);
      return null;
    }
  }

  /**
   * Update draw status
   * @param drawId - ID of the draw
   * @param status - New status (status_closed)
   * @returns Promise with updated draw
   */
  static async updateStatus(drawId: string | number, status: 'success' | 'reported'): Promise<void> {
    try {
      await apiClient.patch(
        `${settings.api.endpoints.draws}${drawId}/`,
        { status_closed: status }
      );
      console.info(`[Status updated for drawId: ${drawId}] to ${status}`);
    } catch (error) {
      console.error(`Error updating status for draw ${drawId}:`, error);
      throw error;
    }
  }
}