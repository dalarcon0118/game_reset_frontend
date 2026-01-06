import { FinancialSummary } from '@/types';
import { mockFinancialSummary } from '@/data/mockData';
import { to, AsyncResult } from '../utils/generators';

// Simulate server response delay
const RESPONSE_DELAY = 500;

export class FinancialSummaryService {
  /**
   * Get financial summary data
   * @returns Promise<AsyncResult<FinancialSummary>>
   */
  static get(): Promise<AsyncResult<FinancialSummary>> {
    const promise = new Promise<FinancialSummary>((resolve) => {
      setTimeout(() => {
        resolve({...mockFinancialSummary});
      }, RESPONSE_DELAY);
    });
    return to(promise);
  }
}