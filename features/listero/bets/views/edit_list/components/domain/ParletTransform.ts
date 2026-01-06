import { FijosCorridosBet } from '@/types';
import { splitStringToPairs } from '../../utils/numbers';

export function extractUniqueNumbers(bets: FijosCorridosBet[]): number[] {
  const uniques = new Set<number>();
  for (const b of bets) uniques.add(b.bet);
  return Array.from(uniques);
}

export function parseInputToBetNumbers(input: string): number[] {
  const pairs = splitStringToPairs(input);
  const numbers: number[] = [];
  for (const pair of pairs) {
    if (pair.length === 2) {
      const n = parseInt(pair, 10);
      if (!isNaN(n)) numbers.push(n);
    }
  }
  return numbers;
}