import { RemoteData, Cmd } from '@core/tea-utils';
import { FinancialSummary, SummaryPluginContext } from './domain/models';
import { Msg } from './msg';

export interface DailyTotals {
  totalCollected: number;
  premiumsPaid: number;
  netResult: number;
  estimatedCommission: number;
  amountToRemit: number;
}

export interface Model {
  financialSummary: RemoteData<any, FinancialSummary>;
  dailyTotals: DailyTotals;
  showBalance: boolean;
  commissionRate: number;
  structureId: string;
  context: SummaryPluginContext | null;
  contextError: string | null;
  trustedNow: number | null;
}

export const initialModel = (): [Model, Cmd] => {
  return [
    {
      financialSummary: RemoteData.notAsked(),
      dailyTotals: {
        totalCollected: 0,
        premiumsPaid: 0,
        netResult: 0,
        estimatedCommission: 0,
        amountToRemit: 0
      },
      showBalance: true,
      commissionRate: 0,
      structureId: '1',
      context: null,
      contextError: null,
      trustedNow: null
    },
    Cmd.none
  ];
};