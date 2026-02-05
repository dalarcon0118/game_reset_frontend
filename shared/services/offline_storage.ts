import AsyncStorage from '@react-native-async-storage/async-storage';
import { CreateBetDTO } from './bet';

const PENDING_BETS_KEY = '@pending_bets';
const LAST_DRAWS_KEY = '@last_draws';
const LAST_SUMMARY_KEY = '@last_summary';

export interface PendingBet extends CreateBetDTO {
  offlineId: string;
  timestamp: number;
}

export class OfflineStorage {
  static async saveLastDraws(draws: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_DRAWS_KEY, JSON.stringify({
        data: draws,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error saving last draws offline:', error);
    }
  }

  static async getLastDraws(): Promise<any[] | null> {
    try {
      const stored = await AsyncStorage.getItem(LAST_DRAWS_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);

      // We could check if data is too old (e.g. > 24h)
      const isTooOld = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000;
      if (isTooOld) {
        await AsyncStorage.removeItem(LAST_DRAWS_KEY);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.error('Error getting last draws offline:', error);
      return null;
    }
  }

  static async saveLastSummary(summary: any): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_SUMMARY_KEY, JSON.stringify({
        data: summary,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error saving last summary offline:', error);
    }
  }

  static async getLastSummary(): Promise<any | null> {
    try {
      const stored = await AsyncStorage.getItem(LAST_SUMMARY_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);

      // We could check if data is too old (e.g. > 24h)
      const isTooOld = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000;
      if (isTooOld) {
        await AsyncStorage.removeItem(LAST_SUMMARY_KEY);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.error('Error getting last summary offline:', error);
      return null;
    }
  }

  static async savePendingBet(betData: CreateBetDTO): Promise<void> {
    try {
      const pendingBets = await this.getPendingBets();
      const newPendingBet: PendingBet = {
        ...betData,
        offlineId: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
      };

      pendingBets.push(newPendingBet);
      await AsyncStorage.setItem(PENDING_BETS_KEY, JSON.stringify(pendingBets));
      console.log('Bet saved offline successfully');
    } catch (error) {
      console.error('Error saving bet offline:', error);
      throw error;
    }
  }

  static async getPendingBets(): Promise<PendingBet[]> {
    try {
      const storedBets = await AsyncStorage.getItem(PENDING_BETS_KEY);
      return storedBets ? JSON.parse(storedBets) : [];
    } catch (error) {
      console.error('Error getting pending bets:', error);
      return [];
    }
  }

  static async removePendingBet(offlineId: string): Promise<void> {
    try {
      const pendingBets = await this.getPendingBets();
      const filteredBets = pendingBets.filter(bet => bet.offlineId !== offlineId);
      await AsyncStorage.setItem(PENDING_BETS_KEY, JSON.stringify(filteredBets));
    } catch (error) {
      console.error('Error removing pending bet:', error);
    }
  }

  static async clearAllPendingBets(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PENDING_BETS_KEY);
    } catch (error) {
      console.error('Error clearing pending bets:', error);
    }
  }
}
