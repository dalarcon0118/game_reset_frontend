import { DrawType } from '@/types';

export interface BetLimit {
  fijo: number;
  corrido: number;
  parlet: number;
  centena: number;
}

export interface PrizePerDollar {
  fijo: number;
  corrido: number;
  parlet: number;
  centena: number;
}

export interface LimitedPrizePerDollar {
  fijo: number;
  corrido: number;
  parlet: number;
  centena: number;
}

export interface ProfitPercentage {
  fijo: number;
  corrido: number;
  parlet: number;
  centena: number;
}

export interface LimitedNumbers {
  day: string[];
  night: string[];
}

export interface ParletLimits {
  day: string[];
  night: string[];
}

export interface DrawRules {
  drawId: string;
  betLimits: BetLimit;
  prizesPerDollar: PrizePerDollar;
  limitedPrizesPerDollar: LimitedPrizePerDollar;
  profitPercentage: ProfitPercentage;
  limitedNumbers: LimitedNumbers;
  parletLimits: ParletLimits;
}