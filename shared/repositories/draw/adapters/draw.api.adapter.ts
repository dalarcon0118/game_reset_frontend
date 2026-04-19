import { IDrawRepository, Draw, DrawClosureConfirmation, BetType, DrawRule, DrawFinancialState } from '../draw.ports';
import { DrawApi } from '../api/api';
import { Result, ok, err } from 'neverthrow';
import { ExtendedDrawType } from '@/shared/services/draw/types';
import { mapBackendDrawToFrontend } from '@/shared/services/draw/mapper';
import { mapAxiosErrorToDrawError, StructuredDrawError } from '../mappers/draw.error-mapper';

/**
 * Resultado de una operación que puede incluir un error estructurado de draw.
 */
export type DrawOperationResult<T> = Result<T, StructuredDrawError>;

/**
 * @deprecated Use DrawRepository from draw.repository.ts for offline support and full IDrawRepository implementation
 */
export class DrawApiAdapter implements IDrawRepository {
  async getDraws(params: Record<string, any> = {}): Promise<Result<ExtendedDrawType[], Error>> {
    try {
      const backendDraws = await DrawApi.list(params);
      return ok(backendDraws.map(mapBackendDrawToFrontend));
    } catch (error: any) {
      // Verificar si es un error estructurado del backend
      const drawError = mapAxiosErrorToDrawError(error);
      return err(new Error(drawError.message));
    }
  }

  async getDraw(id: string | number): Promise<Result<ExtendedDrawType, Error>> {
    try {
      const draw = await DrawApi.getOne(id);
      return ok(mapBackendDrawToFrontend(draw));
    } catch (error: any) {
      const drawError = mapAxiosErrorToDrawError(error);
      return err(new Error(drawError.message));
    }
  }

  async getBetTypes(drawId: string | number): Promise<Result<BetType[], Error>> {
    try {
      const types = await DrawApi.getBetTypes(drawId);
      return ok(types);
    } catch (error: any) {
      const drawError = mapAxiosErrorToDrawError(error);
      return err(new Error(drawError.message));
    }
  }

  async getFinancialState(drawId: string | number): Promise<Result<DrawFinancialState, Error>> {
    return ok({
      drawId: String(drawId),
      lastUpdated: Date.now(),
      local: { totalCollected: 0, totalPaid: 0, netResult: 0, betCount: 0 },
      combined: { totalCollected: 0, totalPaid: 0, netResult: 0, betCount: 0, pendingSync: false }
    });
  }

  async getOne(id: string | number): Promise<Draw> {
    return await DrawApi.getOne(id);
  }

  async list(params: Record<string, any> = {}): Promise<Draw[]> {
    return await DrawApi.list(params);
  }

  async getRulesForDraw(drawId: string | number): Promise<DrawRule[]> {
    return await DrawApi.getRulesForDraw(drawId);
  }

  async addWinningNumbers(drawId: string | number, data: { winning_number: string; date: string }): Promise<any> {
    return await DrawApi.addWinningNumbers(drawId, data);
  }

  async updateStatus(drawId: string | number, status: 'success' | 'reported'): Promise<void> {
    return await DrawApi.updateStatus(drawId, status);
  }

  async getClosureConfirmationsByDraw(drawId: string | number): Promise<DrawClosureConfirmation[]> {
    return await DrawApi.getClosureConfirmationsByDraw(drawId);
  }

  async createClosureConfirmationsForDraw(
    drawId: string | number,
    data?: { status?: string; notes?: string }
  ): Promise<DrawClosureConfirmation[]> {
    return await DrawApi.createClosureConfirmationsForDraw(drawId, data);
  }

  async confirmClosure(
    confirmationId: number,
    status: 'confirmed_success' | 'reported_issue' | 'rejected',
    notes: string
  ): Promise<DrawClosureConfirmation> {
    return await DrawApi.confirmClosure(confirmationId, status, notes);
  }
}

// Re-exportar el error mapper para uso directo
export { mapAxiosErrorToDrawError, createDrawError, extractDrawErrorFromResponse } from '../mappers/draw.error-mapper';
export type { StructuredDrawError } from '../mappers/draw.error-mapper';
