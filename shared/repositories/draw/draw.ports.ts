import { BackendDraw, DrawClosureConfirmation, BetType, DrawRule } from './api/types/types';
import { Result } from 'neverthrow';
import { ExtendedDrawType } from '@/shared/services/draw/types';

export type Draw = BackendDraw;
export { DrawClosureConfirmation, BetType, DrawRule };

export interface DrawFinancialState {
  drawId: string;
  lastUpdated: number;
  local: {
    totalCollected: number;
    totalPaid: number;
    netResult: number;
    betCount: number;
  };
  server?: {
    totalCollected: number;
    totalPaid: number;
    netResult: number;
    betCount: number;
    lastSync: number;
  };
  combined: {
    totalCollected: number;
    totalPaid: number;
    netResult: number;
    betCount: number;
    pendingSync: boolean;
  };
}

export interface IDrawRepository {
  // Legacy-compatible methods
  getDraws(params?: Record<string, any>): Promise<Result<ExtendedDrawType[], Error>>;
  getDraw(id: string | number): Promise<Result<ExtendedDrawType, Error>>;
  getBetTypes(drawId: string | number): Promise<Result<BetType[], Error>>;
  getFinancialState(drawId: string | number): Promise<Result<DrawFinancialState, Error>>;

  // Base methods
  getOne(id: string | number): Promise<Draw>;
  list(params?: Record<string, any>): Promise<Draw[]>;
  getRulesForDraw(drawId: string | number): Promise<DrawRule[]>;
  addWinningNumbers(drawId: string | number, data: { winning_number: string; date: string }): Promise<any>;
  updateStatus(drawId: string | number, status: 'success' | 'reported'): Promise<void>;
  getClosureConfirmationsByDraw(drawId: string | number): Promise<DrawClosureConfirmation[]>;
  createClosureConfirmationsForDraw(
    drawId: string | number,
    data?: { status?: string; notes?: string }
  ): Promise<DrawClosureConfirmation[]>;
  confirmClosure(
    confirmationId: number,
    status: 'confirmed_success' | 'reported_issue' | 'rejected',
    notes: string
  ): Promise<DrawClosureConfirmation>;
}
