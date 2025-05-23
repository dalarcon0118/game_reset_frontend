import { FinancialSummary } from '@/types';
import { mockFinancialSummary } from '@/data/mockData';

// Simulate server response delay
const RESPONSE_DELAY = 500;

export class FinancialSummaryService {
  /**
   * Get financial summary data
   * @returns Promise<FinancialSummary>
   */
  static get(): Promise<FinancialSummary> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({...mockFinancialSummary});
      }, RESPONSE_DELAY);
    });
  }
}