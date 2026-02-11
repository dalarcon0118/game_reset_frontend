// Casos de uso - Orquestan la lógica de negocio sin efectos secundarios
import { 
  FinancialSummary, 
  PendingBet, 
  UserProfile, 
  UserPreferences, 
  DailyTotals 
} from '../../domain/models';
import { FinancialCalculatorService } from '../../domain/services/financial-calculator.service';
import { TimeRangeService } from '../../domain/services/time-range.service';

export interface CalculateDailyTotalsInput {
  financialSummary: FinancialSummary | null;
  pendingBets: PendingBet[] | null;
  commissionRate: number;
}

export class CalculateDailyTotalsUseCase {
  constructor(
    private financialCalculator: FinancialCalculatorService,
    private timeRangeService: TimeRangeService
  ) {}

  execute(input: CalculateDailyTotalsInput): DailyTotals {
    const { financialSummary, pendingBets, commissionRate } = input;
    
    let totals: DailyTotals;

    // Calcular totales del resumen financiero
    if (financialSummary) {
      totals = this.financialCalculator.calculateFromSummary(financialSummary);
    } else {
      totals = this.getEmptyTotals();
    }

    // Agregar impacto de apuestas pendientes
    if (pendingBets && pendingBets.length > 0) {
      const todayRange = this.timeRangeService.getTodayRange();
      const pendingImpact = this.financialCalculator.calculatePendingImpact(
        pendingBets,
        commissionRate,
        todayRange
      );
      
      totals = this.financialCalculator.combineTotals(totals, pendingImpact);
    }

    return totals;
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