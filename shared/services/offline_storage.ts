import storageClient from './storage_client';
import { CreateBetDTO } from './bet/types';
import { logger } from '../utils/logger';

const log = logger.withTag('OFFLINE_STORAGE');

const PENDING_BETS_KEY = '@pending_bets';
const LAST_DRAWS_KEY = '@last_draws';
const LAST_SUMMARY_KEY = '@last_summary';

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
    await storageClient.set(LAST_DRAWS_KEY, {
      data: draws,
      timestamp: Date.now()
    });
  }

  static async getLastDraws(): Promise<any[] | null> {
    const parsed = await storageClient.get<{ data: any[], timestamp: number }>(LAST_DRAWS_KEY);
    if (!parsed) return null;

    // Strict Daily Reset: Data is only valid for the current calendar day
    const savedDate = new Date(parsed.timestamp);
    const currentDate = new Date();

    const isSameDay = savedDate.getDate() === currentDate.getDate() &&
      savedDate.getMonth() === currentDate.getMonth() &&
      savedDate.getFullYear() === currentDate.getFullYear();

    if (!isSameDay) {
      log.info('Draws cache expired (new day). Clearing.');
      await storageClient.remove(LAST_DRAWS_KEY);
      return null;
    }

    return parsed.data;
  }

  static async saveLastSummary(summary: any): Promise<void> {
    await storageClient.set(LAST_SUMMARY_KEY, {
      data: summary,
      timestamp: Date.now()
    });
  }

  static async getLastSummary(): Promise<any | null> {
    const parsed = await storageClient.get<{ data: any, timestamp: number }>(LAST_SUMMARY_KEY);
    if (!parsed) return null;

    // Strict Daily Reset: Summary is only valid for the current calendar day
    const savedDate = new Date(parsed.timestamp);
    const currentDate = new Date();

    const isSameDay = savedDate.getDate() === currentDate.getDate() &&
      savedDate.getMonth() === currentDate.getMonth() &&
      savedDate.getFullYear() === currentDate.getFullYear();

    if (!isSameDay) {
      log.info('Summary cache expired (new day). Clearing.');
      await storageClient.remove(LAST_SUMMARY_KEY);
      return null;
    }

    return parsed.data;
  }

  static async savePendingBet(betData: CreateBetDTO, forcedId?: string): Promise<string> {
    const pendingBets = await this.getPendingBets();
    const offlineId = forcedId || Math.random().toString(36).substring(7);
    const newPendingBet: PendingBet = {
      ...betData,
      offlineId,
      timestamp: Date.now(),
      status: 'pending',
    };

    pendingBets.push(newPendingBet);
    await storageClient.set(PENDING_BETS_KEY, pendingBets);
    log.info('Bet saved offline successfully', { offlineId });
    return offlineId;
  }

  /**
   * Marca una apuesta como sincronizada (no la elimina)
   * Las apuestas sincronizadas se mantienen hasta la limpieza diaria
   */
  static async markAsSynced(offlineId: string): Promise<void> {
    const pendingBets = await this.getPendingBets();
    const updatedBets = pendingBets.map(bet => {
      if (bet.offlineId === offlineId) {
        return {
          ...bet,
          status: 'synced' as BetStatus,
          syncedAt: Date.now(),
        };
      }
      return bet;
    });
    await storageClient.set(PENDING_BETS_KEY, updatedBets);
    log.info('Bet marked as synced', { offlineId });
  }

  /**
   * Marca una apuesta con error de sincronización
   */
  static async markAsError(offlineId: string, errorMessage: string): Promise<void> {
    const pendingBets = await this.getPendingBets();
    const updatedBets = pendingBets.map(bet => {
      if (bet.offlineId === offlineId) {
        return {
          ...bet,
          status: 'error' as BetStatus,
          errorMessage,
        };
      }
      return bet;
    });
    await storageClient.set(PENDING_BETS_KEY, updatedBets);
    log.info('Bet marked as error', { offlineId, errorMessage });
  }

  /**
   * Limpia las apuestas sincronizadas del día anterior
   * Se ejecuta automáticamente a las 00:00
   */
  static async cleanupSyncedBets(): Promise<void> {
    const pendingBets = await this.getPendingBets();
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const remainingBets = pendingBets.filter(bet => {
      // Mantener apuestas pendientes y con error
      if (bet.status === 'pending' || bet.status === 'error') {
        return true;
      }

      // Para las sincronizadas, verificar si son del día actual
      if (bet.status === 'synced' && bet.syncedAt) {
        const syncedDate = new Date(bet.syncedAt);
        const isToday = syncedDate.getDate() === currentDay &&
          syncedDate.getMonth() === currentMonth &&
          syncedDate.getFullYear() === currentYear;

        // Mantener solo las sincronizadas del día actual
        return isToday;
      }

      return true;
    });

    const cleanedCount = pendingBets.length - remainingBets.length;
    if (cleanedCount > 0) {
      await storageClient.set(PENDING_BETS_KEY, remainingBets);
      log.info(`Cleaned up ${cleanedCount} synced bets from previous days`);
    }
  }

  static async getPendingBets(): Promise<PendingBet[]> {
    const bets = await storageClient.get<PendingBet[]>(PENDING_BETS_KEY);
    if (!bets) return [];
    return bets.filter(bet => bet.status === 'pending' || bet.status === 'error');
  }

  static async getAllDailyBets(): Promise<PendingBet[]> {
    const bets = await storageClient.get<PendingBet[]>(PENDING_BETS_KEY);
    if (!bets) return [];

    // Filtrar solo las del día actual
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return bets.filter(bet => {
      const betDate = new Date(bet.timestamp);
      return betDate.getDate() === currentDay &&
        betDate.getMonth() === currentMonth &&
        betDate.getFullYear() === currentYear;
    });
  }

  static async removePendingBet(offlineId: string): Promise<void> {
    const pendingBets = await this.getPendingBets();
    const filteredBets = pendingBets.filter(bet => bet.offlineId !== offlineId);
    await storageClient.set(PENDING_BETS_KEY, filteredBets);
  }

  /**
   * Prunes pending bets that are older than 48 hours to prevent storage clutter.
   */
  static async pruneStalePendingBets(maxAgeMs: number = 48 * 60 * 60 * 1000): Promise<void> {
    const pendingBets = await this.getPendingBets();
    if (pendingBets.length === 0) return;

    const now = Date.now();
    const validBets = pendingBets.filter(bet => (now - bet.timestamp) <= maxAgeMs);

    if (validBets.length < pendingBets.length) {
      log.info(`Pruning ${pendingBets.length - validBets.length} stale pending bets`);
      await storageClient.set(PENDING_BETS_KEY, validBets);
    }
  }

  static async clearAllPendingBets(): Promise<void> {
    await storageClient.remove(PENDING_BETS_KEY);
  }
}
