import { DrawType, GameType } from '@/types';
import { mockDraws } from '@/data/mock_data';
import { OfflineStorage } from './offline_storage';
import { DrawApi } from './draw/api';
import { mapBackendDrawToFrontend, mapStatus } from './draw/mapper';
import { ExtendedDrawType, DrawClosureConfirmation } from './draw/types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('DRAW_SERVICE');

export type { ExtendedDrawType, DrawClosureConfirmation };

export class DrawService {
  /**
   * Get a single draw by ID
   * @param id - The ID of the draw
   * @returns Promise with ExtendedDrawType or null
   */
  static async getOne(id: string): Promise<ExtendedDrawType | null> {
    try {
      const response = await DrawApi.getOne(id);
      if (!response) return null;
      return mapBackendDrawToFrontend(response);
    } catch (error) {
      log.error('Error fetching draw', error);
      return null;
    }
  }

  /**
   * Get bet types for a specific draw
   * @param drawId - ID of the draw
   * @returns Promise with array of GameType
   */
  static async getBetTypes(drawId: string): Promise<GameType[]> {
    try {
      return await DrawApi.getBetTypes(drawId);
    } catch (error: any) {
      log.error(`Error fetching bet types for draw ${drawId}`, error);
      throw error;
    }
  }

  /**
   * List draws with optional filters
   * @param params - Filters for the list
   * @returns Promise with array of ExtendedDrawType
   */
  static async list(params: Record<string, any> = {}): Promise<ExtendedDrawType[]> {
    try {
      const response = await DrawApi.list(params);

      if (response && Array.isArray(response)) {
        await OfflineStorage.saveLastDraws(response);
      }

      return response.map(mapBackendDrawToFrontend);
    } catch (error: any) {
      log.warn('Network error or rate limit, falling back to offline cache', error);
      const cachedDraws = await OfflineStorage.getLastDraws();
      if (cachedDraws && Array.isArray(cachedDraws)) {
        return cachedDraws.map(mapBackendDrawToFrontend);
      }
      throw error;
    }
  }

  /**
   * Map backend status to frontend status (internal helper maintained for compatibility)
   */
  private static mapStatus = mapStatus;

  /**
   * Filter draws based on criteria (Mock logic)
   */
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
          if (criteria.status === 'active') {
            filteredDraws = filteredDraws.filter(draw =>
              draw.status === 'open' || draw.status === 'pending' || draw.status === 'scheduled'
            );
          } else {
            filteredDraws = filteredDraws.filter(draw => draw.status === 'closed');
          }
        }
        resolve(filteredDraws);
      }, 500);
    });
  }

  /**
   * Filter bet types by draw ID
   */
  static async filterBetsTypeByDrawId(drawId: string): Promise<GameType[]> {
    const response = await DrawApi.getBetTypes(drawId);
    return response.map(t => ({
      id: t.id.toString(),
      name: t.name,
      code: t.code,
      description: t.description
    }));
  }

  /**
   * Get all rules (validation and reward) for a draw
   */
  static async getRulesForDraw(drawId: string): Promise<any> {
    try {
      return await DrawApi.getRulesForDraw(drawId);
    } catch (error) {
      log.error(`Error fetching rules for draw ${drawId}`, error);
      return null;
    }
  }

  /**
   * Add winning numbers to a draw
   */
  static async addWinningNumbers(
    drawId: string,
    data: { winning_number: string; date: string }
  ): Promise<any> {
    try {
      return await DrawApi.addWinningNumbers(drawId, data);
    } catch (error) {
      log.error(`Error adding winning numbers to draw ${drawId}`, error);
      return null;
    }
  }

  /**
   * Update draw status
   */
  static async updateStatus(drawId: string | number, status: 'success' | 'reported'): Promise<void> {
    try {
      await DrawApi.updateStatus(drawId, status);
    } catch (error) {
      log.error(`Error updating status for draw ${drawId}`, error);
      throw error;
    }
  }

  // ===== DRAW CLOSURE CONFIRMATION METHODS =====

  static async getClosureConfirmationsByDraw(drawId: string | number): Promise<DrawClosureConfirmation[]> {
    try {
      return await DrawApi.getClosureConfirmationsByDraw(drawId);
    } catch (error) {
      log.error(`Error fetching closure confirmations for draw ${drawId}`, error);
      return [];
    }
  }

  static async createClosureConfirmationsForDraw(
    drawId: string | number,
    data?: { status?: 'pending' | 'confirmed_success' | 'reported_issue' | 'rejected'; notes?: string }
  ): Promise<DrawClosureConfirmation[]> {
    try {
      return await DrawApi.createClosureConfirmationsForDraw(drawId, data);
    } catch (error) {
      log.error(`Error creating closure confirmations for draw ${drawId}`, error);
      throw error;
    }
  }

  static async confirmClosure(
    confirmationId: string | number,
    status: 'confirmed_success' | 'reported_issue' | 'rejected',
    notes?: string
  ): Promise<DrawClosureConfirmation> {
    try {
      return await DrawApi.confirmClosure(confirmationId, status, notes);
    } catch (error) {
      log.error(`Error confirming closure ${confirmationId}`, error);
      throw error;
    }
  }

  static async getPendingClosureConfirmations(): Promise<DrawClosureConfirmation[]> {
    try {
      return await DrawApi.getPendingClosureConfirmations();
    } catch (error) {
      log.error('Error fetching pending closure confirmations', error);
      return [];
    }
  }

  static async getClosureConfirmations(filters?: any): Promise<DrawClosureConfirmation[]> {
    try {
      return await DrawApi.getClosureConfirmations(filters);
    } catch (error) {
      log.error('Error fetching closure confirmations', error);
      return [];
    }
  }

  static async updateClosureConfirmation(
    confirmationId: string | number,
    data: Partial<Pick<DrawClosureConfirmation, 'status' | 'notes'>>
  ): Promise<DrawClosureConfirmation> {
    try {
      return await DrawApi.updateClosureConfirmation(confirmationId, data);
    } catch (error) {
      log.error(`Error updating closure confirmation ${confirmationId}`, error);
      throw error;
    }
  }

  static async deleteClosureConfirmation(confirmationId: string | number): Promise<void> {
    try {
      await DrawApi.deleteClosureConfirmation(confirmationId);
    } catch (error) {
      log.error(`Error deleting closure confirmation ${confirmationId}`, error);
      throw error;
    }
  }
}
