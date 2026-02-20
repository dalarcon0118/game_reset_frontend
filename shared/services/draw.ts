import { DrawType, GameType } from '@/types';
import { mockDraws } from '@/data/mock_data';
import { DrawApi } from './draw/api';
import { mapBackendDrawToFrontend, mapStatus } from './draw/mapper';
import { mapBetTypesToGameTypes } from './draw/mappers/bet_type.mapper';
import { ExtendedDrawType, DrawClosureConfirmation } from './draw/types';
import { logger } from '@/shared/utils/logger';
import { OfflineFirstDrawRepository } from '@/shared/repositories/draw.repository';
import { retry } from '@/shared/utils/retry';
import { Result, ok, err } from 'neverthrow';

const log = logger.withTag('DRAW_SERVICE');

export type { ExtendedDrawType, DrawClosureConfirmation };

export class DrawService {
  /**
   * Get a single draw by ID
   * @param id - The ID of the draw
   * @returns Promise<Result<ExtendedDrawType, Error>>
   */
  static async getOne(id: string): Promise<Result<ExtendedDrawType, Error>> {
    try {
      const response = await DrawApi.getOne(id);
      if (!response) {
        return err(new Error('Draw not found'));
      }
      return ok(mapBackendDrawToFrontend(response));
    } catch (error) {
      log.error('Error fetching draw', error);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get bet types for a specific draw
   * @param drawId - ID of the draw
   * @returns Promise<Result<GameType[], Error>>
   */
  static async getBetTypes(drawId: string): Promise<Result<GameType[], Error>> {
    try {
      const response = await DrawApi.getBetTypes(drawId);
      return ok(mapBetTypesToGameTypes(response));
    } catch (error: any) {
      log.error(`Error fetching bet types for draw ${drawId}`, error);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * List draws with optional filters
   * @param params - Filters for the list
   * @returns Promise<Result<ExtendedDrawType[], Error>>
   */
  static async list(params: Record<string, any> = {}): Promise<Result<ExtendedDrawType[], Error>> {
    const startTime = Date.now();
    const repository = new OfflineFirstDrawRepository();

    const retryResult = await retry(async () => {
      const result = await repository.getDraws(params);

      if (result.isErr()) {
        log.error('Repository failed to get draws', {
          params,
          error: result.error.message,
          duration: Date.now() - startTime
        });
        throw result.error;
      }

      return result.value;
    });

    if (!retryResult.success) {
      return err(retryResult.error);
    }

    log.info('Draws retrieved successfully', {
      params,
      count: retryResult.data.length,
      duration: Date.now() - startTime,
      attempts: retryResult.attempts
    });

    return ok(retryResult.data);
  }

  /**
   * Map backend status to frontend status (internal helper maintained for compatibility)
   */
  private static mapStatus = mapStatus;

  /**
   * Filter draws based on criteria (Mock logic)
   * @deprecated Use list() instead
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
   * @returns Promise<Result<GameType[], Error>>
   */
  static async filterBetsTypeByDrawId(drawId: string): Promise<Result<GameType[], Error>> {
    try {
      const response = await DrawApi.getBetTypes(drawId);
      return ok(mapBetTypesToGameTypes(response));
    } catch (error) {
      log.error(`Error filtering bet types for draw ${drawId}`, error);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get all rules (validation and reward) for a draw
   * @returns Promise<Result<any, Error>>
   */
  static async getRulesForDraw(drawId: string): Promise<Result<any, Error>> {
    try {
      const rules = await DrawApi.getRulesForDraw(drawId);
      return ok(rules);
    } catch (error) {
      log.error(`Error fetching rules for draw ${drawId}`, error);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Add winning numbers to a draw
   * @returns Promise<Result<any, Error>>
   */
  static async addWinningNumbers(
    drawId: string,
    data: { winning_number: string; date: string }
  ): Promise<Result<any, Error>> {
    try {
      const result = await DrawApi.addWinningNumbers(drawId, data);
      return ok(result);
    } catch (error) {
      log.error(`Error adding winning numbers to draw ${drawId}`, error);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Update draw status
   * @returns Promise<Result<void, Error>>
   */
  static async updateStatus(drawId: string | number, status: 'success' | 'reported'): Promise<Result<void, Error>> {
    try {
      await DrawApi.updateStatus(drawId, status);
      return ok(undefined);
    } catch (error) {
      log.error(`Error updating status for draw ${drawId}`, error);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // ===== DRAW CLOSURE CONFIRMATION METHODS =====

  static async getClosureConfirmationsByDraw(drawId: string | number): Promise<Result<DrawClosureConfirmation[], Error>> {
    try {
      const confirmations = await DrawApi.getClosureConfirmationsByDraw(drawId);
      return ok(confirmations);
    } catch (error) {
      log.error(`Error fetching closure confirmations for draw ${drawId}`, error);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  static async createClosureConfirmationsForDraw(
    drawId: string | number,
    data?: { status?: 'pending' | 'confirmed_success' | 'reported_issue' | 'rejected'; notes?: string }
  ): Promise<Result<DrawClosureConfirmation[], Error>> {
    try {
      const confirmations = await DrawApi.createClosureConfirmationsForDraw(drawId, data);
      return ok(confirmations);
    } catch (error) {
      log.error(`Error creating closure confirmations for draw ${drawId}`, error);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  static async confirmClosure(
    confirmationId: string | number,
    status: 'confirmed_success' | 'reported_issue' | 'rejected',
    notes?: string
  ): Promise<Result<DrawClosureConfirmation, Error>> {
    try {
      const confirmation = await DrawApi.confirmClosure(confirmationId, status, notes);
      return ok(confirmation);
    } catch (error) {
      log.error(`Error confirming closure ${confirmationId}`, error);
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
