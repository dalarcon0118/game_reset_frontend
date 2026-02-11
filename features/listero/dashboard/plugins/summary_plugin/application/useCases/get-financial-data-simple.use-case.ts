import { FinancialSummary, PendingBet, DailyTotals } from '../../domain/models';
import { FinancialCalculatorService } from '../../domain/services/financial-calculator.service';
import { TimeRangeService } from '../../domain/services/time-range.service';
import { SummaryPluginContext } from '../../domain/services';

export interface GetFinancialDataInput {
  structureId: string;
  commissionRate: number;
  context: SummaryPluginContext;
}

export interface GetFinancialDataResult {
  financialSummary: FinancialSummary | null;
  pendingBets: PendingBet[];
  dailyTotals: DailyTotals;
}

export class GetFinancialDataUseCase {
  constructor(
    private financialCalculator: FinancialCalculatorService,
    private timeRangeService: TimeRangeService
  ) { }

  async execute(input: GetFinancialDataInput): Promise<GetFinancialDataResult> {
    const { structureId, commissionRate, context } = input;

    // Obtener resumen financiero usando el servicio del contexto
    let financialSummary: FinancialSummary | null = null;
    try {
      const [error, data] = await context.api.FinancialSummaryService.get(structureId);

      if (!error && data) {
        financialSummary = {
          totalCollected: data.totalCollected,
          premiumsPaid: data.premiumsPaid,
          estimatedCommission: 0, // Se calcula después
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error('[GetFinancialDataUseCase] Error fetching financial summary:', error);
    }

    // Obtener apuestas pendientes del almacenamiento offline del contexto
    const offlinePendingBets: any[] = await context.storage.getItem('pending-bets') || [];
    const pendingBets: PendingBet[] = offlinePendingBets.map(bet => ({
      id: bet.offlineId,
      amount: bet.amount,
      timestamp: bet.timestamp,
      status: 'pending' as const
    }));

    // ... (rest of the calculation logic stays the same)
    let dailyTotals: DailyTotals;

    if (financialSummary) {
      const baseTotals = this.financialCalculator.calculateFromSummary(financialSummary);

      if (pendingBets.length > 0) {
        const todayRange = this.timeRangeService.getTodayRange();
        const pendingImpact = this.financialCalculator.calculatePendingImpact(
          pendingBets,
          commissionRate,
          todayRange
        );

        dailyTotals = this.financialCalculator.combineTotals(baseTotals, pendingImpact);
      } else {
        dailyTotals = baseTotals;
      }
    } else {
      if (pendingBets.length > 0) {
        const todayRange = this.timeRangeService.getTodayRange();
        dailyTotals = this.financialCalculator.calculatePendingImpact(
          pendingBets,
          commissionRate,
          todayRange
        );
      } else {
        dailyTotals = this.getEmptyTotals();
      }
    }

    return {
      financialSummary,
      pendingBets,
      dailyTotals
    };
  }

  private getEmptyTotals(): DailyTotals {
    return {
      totalCollected: 0,
      premiumsPaid: 0,
      netResult: 0,
      estimatedCommission: 0,
      amountToRemit: 0
    };
  }
}