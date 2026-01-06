import { DrawType, GameType } from '@/types';
import { mockDraws } from '@/data/mockData';
import apiClient from '@/shared/services/ApiClient';
import settings from '@/config/settings';
import { to, AsyncResult } from '../utils/generators';

// Simulate server response delay
const RESPONSE_DELAY = 500;

// Extended DrawType interface to include hierarchical closure data
export interface ExtendedDrawType extends DrawType {
  hierarchical_closure_status?: string | null;
  closure_confirmations_count?: {
    total: number;
    pending: number;
    confirmed_success: number;
    reported_issue: number;
    rejected: number;
  };
}

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
  hierarchical_closure_status: string | null;
  closure_confirmations_count: {
    total: number;
    pending: number;
    confirmed_success: number;
    reported_issue: number;
    rejected: number;
  };
}

// Draw closure confirmation types
export interface DrawClosureConfirmation {
  id: number;
  draw: number;
  structure: number;
  structure_name: string;
  structure_type: string;
  confirmed_by: number;
  confirmed_by_name: string;
  draw_name: string;
  status: 'pending' | 'confirmed_success' | 'reported_issue' | 'rejected';
  notes: string;
  level_required: number;
  is_mandatory: boolean;
  requires_notification: boolean;
  created_at: string;
  updated_at: string;
}

export class DrawService {
  // Get a single draw by ID
  static async getOne(id: string): Promise<ExtendedDrawType | null> {
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

        // Hierarchical closure fields
        hierarchical_closure_status: response.hierarchical_closure_status,
        closure_confirmations_count: response.closure_confirmations_count,

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
   * @returns Promise with array of ExtendedDrawType (filtered by current date on backend)
   * @example
   * // Get all draws for a specific structure
   * const draws = await DrawService.list(10);
   *
   * // Get all draws (no filter)
   * const allDraws = await DrawService.list();
   */
  static list(structureId?: number): Promise<AsyncResult<ExtendedDrawType[]>> {
    const promise = (async () => {
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


      // Map backend response to frontend ExtendedDrawType with all fields
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

        // Hierarchical closure fields
        hierarchical_closure_status: backendDraw.hierarchical_closure_status,
        closure_confirmations_count: backendDraw.closure_confirmations_count,

        // Computed UI fields for compatibility
        source: backendDraw.name,
        date: new Date(backendDraw.draw_datetime).toLocaleDateString('es-ES'),
        time: new Date(backendDraw.draw_datetime).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        })
      }));
    })();

    return to(promise);
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

  // ===== DRAW CLOSURE CONFIRMATION METHODS =====

  /**
   * Get all closure confirmations for a specific draw
   * @param drawId - ID of the draw
   * @returns Promise with array of closure confirmations
   */
  static async getClosureConfirmationsByDraw(drawId: string | number): Promise<DrawClosureConfirmation[]> {
    try {
      const response = await apiClient.get<DrawClosureConfirmation[]>(
        `${settings.api.baseUrl}/draw/draw-closure-confirmations/by-draw/${drawId}/`
      );
      console.info(`[Closure confirmations for draw ${drawId}]`, response);
      return response;
    } catch (error) {
      console.error(`Error fetching closure confirmations for draw ${drawId}:`, error);
      return [];
    }
  }

  /**
   * Create closure confirmations for all relevant structures in a draw
   * @param drawId - ID of the draw
   * @param data - Optional initial status and notes
   * @returns Promise with array of created confirmations
   */
  static async createClosureConfirmationsForDraw(
    drawId: string | number,
    data?: { status?: 'pending' | 'confirmed_success' | 'reported_issue' | 'rejected'; notes?: string }
  ): Promise<DrawClosureConfirmation[]> {
    try {
      const payload = data || {};
      const response = await apiClient.post<DrawClosureConfirmation[]>(
        `${settings.api.baseUrl}/draw/draw-closure-confirmations/create-for-draw/${drawId}/`,
        payload
      );
      console.info(`[Created closure confirmations for draw ${drawId}]`, response);
      return response;
    } catch (error) {
      console.error(`Error creating closure confirmations for draw ${drawId}:`, error);
      throw error;
    }
  }

  /**
   * Confirm a specific closure confirmation
   * @param confirmationId - ID of the confirmation
   * @param status - New status for the confirmation
   * @param notes - Optional notes
   * @returns Promise with updated confirmation
   */
  static async confirmClosure(
    confirmationId: string | number,
    status: 'confirmed_success' | 'reported_issue' | 'rejected',
    notes?: string
  ): Promise<DrawClosureConfirmation> {
    try {
      const payload: any = { status };
      if (notes) payload.notes = notes;

      const response = await apiClient.post<DrawClosureConfirmation>(
        `${settings.api.baseUrl}/draw/draw-closure-confirmations/${confirmationId}/confirm/`,
        payload
      );
      console.info(`[Confirmed closure ${confirmationId}] with status ${status}`);
      return response;
    } catch (error) {
      console.error(`Error confirming closure ${confirmationId}:`, error);
      throw error;
    }
  }

  /**
   * Get all pending closure confirmations for the current user
   * @returns Promise with array of pending confirmations
   */
  static async getPendingClosureConfirmations(): Promise<DrawClosureConfirmation[]> {
    try {
      const response = await apiClient.get<DrawClosureConfirmation[]>(
        `${settings.api.baseUrl}/draw/draw-closure-confirmations/pending-for-user/`
      );
      console.info(`[Pending closure confirmations]`, response);
      return response;
    } catch (error) {
      console.error('Error fetching pending closure confirmations:', error);
      return [];
    }
  }

  /**
   * Get all closure confirmations (with optional filters)
   * @param filters - Optional filters
   * @returns Promise with array of confirmations
   */
  static async getClosureConfirmations(filters?: {
    draw?: string | number;
    structure?: string | number;
    status?: 'pending' | 'confirmed_success' | 'reported_issue' | 'rejected';
  }): Promise<DrawClosureConfirmation[]> {
    try {
      let endpoint = `${settings.api.baseUrl}/draw/draw-closure-confirmations/`;

      if (filters) {
        const params = new URLSearchParams();

        if (filters.draw) params.append('draw', filters.draw.toString());
        if (filters.structure) params.append('structure', filters.structure.toString());
        if (filters.status) params.append('status', filters.status);

        if (params.toString()) {
          endpoint += `?${params.toString()}`;
        }
      }

      const response = await apiClient.get<DrawClosureConfirmation[]>(endpoint);
      console.info(`[Closure confirmations with filters]`, filters, response);
      return response;
    } catch (error) {
      console.error('Error fetching closure confirmations:', error);
      return [];
    }
  }

  /**
   * Update a closure confirmation
   * @param confirmationId - ID of the confirmation
   * @param data - Updated data
   * @returns Promise with updated confirmation
   */
  static async updateClosureConfirmation(
    confirmationId: string | number,
    data: Partial<Pick<DrawClosureConfirmation, 'status' | 'notes'>>
  ): Promise<DrawClosureConfirmation> {
    try {
      const response = await apiClient.patch<DrawClosureConfirmation>(
        `${settings.api.baseUrl}/draw/draw-closure-confirmations/${confirmationId}/`,
        data
      );
      console.info(`[Updated closure confirmation ${confirmationId}]`, data);
      return response;
    } catch (error) {
      console.error(`Error updating closure confirmation ${confirmationId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a closure confirmation
   * @param confirmationId - ID of the confirmation
   * @returns Promise
   */
  static async deleteClosureConfirmation(confirmationId: string | number): Promise<void> {
    try {
      await apiClient.delete(
        `${settings.api.baseUrl}/draw/draw-closure-confirmations/${confirmationId}/`
      );
      console.info(`[Deleted closure confirmation ${confirmationId}]`);
    } catch (error) {
      console.error(`Error deleting closure confirmation ${confirmationId}:`, error);
      throw error;
    }
  }
}
