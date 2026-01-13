import AsyncStorage from '@react-native-async-storage/async-storage';
import { CreateBetDTO } from './Bet';

const PENDING_BETS_KEY = '@pending_bets';

export interface PendingBet extends CreateBetDTO {
  offlineId: string;
  timestamp: number;
}

export class OfflineStorage {
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
