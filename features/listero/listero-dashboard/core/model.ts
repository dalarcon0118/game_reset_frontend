import { WebData, RemoteData } from '@core/tea-utils';
import { FinancialSummary, DrawType, BetType } from '@/types';
import { DailyTotals } from '@/shared/domain/financial.types';
import { StatusFilter } from './core.types';
import { DashboardUser } from './user.dto';
import { PromotionState } from '../../../../shared/components/promotion/model';
import { SyncStatus } from './msg';

export type DashboardStatus =
  | { type: 'IDLE' }
  | { type: 'PREPARING_SESSION' }
  | { type: 'LOADING_DATA' }
  | { type: 'READY' }
  | { type: 'ERROR'; message: string };

export interface DrawFinancialTotals {
  drawId: string;
  totalCollected: number;
  premiumsPaid: number;
  netResult: number;
  betCount: number;
  lastUpdated: number;
}

export interface Model {
  status: DashboardStatus;
  draws: WebData<DrawType[]>;
  filteredDraws: DrawType[];
  pendingBets: BetType[];
  syncedBets: BetType[];
  userStructureId: string | null;
  statusFilter: StatusFilter;
  appliedFilter: StatusFilter;
  commissionRate: number;
  showBalance: boolean;
  authToken: string | null;
  currentUser: DashboardUser | null;
  isRateLimited: boolean;
  promotion: PromotionState;
  needsPasswordChange: boolean;
  // SSOT: Financial summary (from summary_plugin)
  financialSummary: RemoteData<any, FinancialSummary>;
  // SSOT: Totals by drawId (from draws_list_plugin)
  totalsByDrawId: Map<string, DrawFinancialTotals>;
  // Trusted time reference for countdown display
  trustedNow: number;
  // SSOT: Daily totals calculated from bets (CQRS pattern - derived state computed on write)
  dailyTotals: DailyTotals;
  // SSOT: Manual sync status
  syncStatus: SyncStatus;
  // Timeout fallback: prevents indefinite LOADING_DATA if SYSTEM_READY never arrives
  timeoutTriggered?: boolean;
}
