import { OfflineFinancialService } from './offline';
import { logger } from '../utils/logger';
import { CreateBetDTO } from './bet/types';

const log = logger.withTag('OFFLINE_STORAGE_DEPRECATED');

export type BetStatus = 'pending' | 'synced' | 'error';

export interface PendingBet extends CreateBetDTO {
  offlineId: string;
  timestamp: number;
  status: BetStatus;
  syncedAt?: number;
  errorMessage?: string;
}

export class OfflineStorage {
  static async saveLastDraws(draws: any[]): Promise<void> {
    log.warn('OfflineStorage.saveLastDraws is deprecated. Use DrawRepository.');
  }

  static async getLastDraws(): Promise<any[] | null> {
    log.warn('OfflineStorage.getLastDraws is deprecated. Use DrawRepository.');
    return null;
  }

  static async saveLastSummary(summary: any): Promise<void> {
    log.warn('OfflineStorage.saveLastSummary is deprecated. Use SummaryRepository.');
  }

  static async getLastSummary(): Promise<any | null> {
    log.warn('OfflineStorage.getLastSummary is deprecated. Use SummaryRepository.');
    return null;
  }

  static async savePendingBet(bet: CreateBetDTO): Promise<string> {
    log.warn('OfflineStorage.savePendingBet is deprecated. Use OfflineFinancialService.');
    throw new Error('OfflineStorage.savePendingBet is deprecated. Please use OfflineFinancialService.placeBet');
  }

  static async getPendingBets(): Promise<PendingBet[]> {
    log.warn('OfflineStorage.getPendingBets is deprecated. Delegating to OfflineFinancialService.');
    const v2Bets = await OfflineFinancialService.getPendingBets();
    return v2Bets.map(b => ({
      ...b,
      offlineId: b.offlineId,
      timestamp: b.createdAt,
      status: (b.status === 'pending' || b.status === 'synced') ? b.status : 'error',
    } as unknown as PendingBet));
  }

  static async updatePendingBet(offlineId: string, updates: Partial<PendingBet>): Promise<void> {
    log.warn('OfflineStorage.updatePendingBet is deprecated.');
  }

  static async removePendingBet(offlineId: string): Promise<void> {
    log.warn('OfflineStorage.removePendingBet is deprecated.');
  }
}
