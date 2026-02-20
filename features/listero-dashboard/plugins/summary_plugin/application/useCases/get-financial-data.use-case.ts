// Caso de uso simplificado para obtener datos financieros usando servicios existentes
import { FinancialSummary, PendingBet, DailyTotals } from '../../domain/models';
import { FinancialCalculatorService } from '../../domain/services/financial-calculator.service';
import { TimeRangeService } from '../../domain/services/time-range.service';
import { FinancialSummaryService } from '@/shared/services/financial_summary';
import { OfflineFinancialService } from '@/shared/services/offline';

export interface GetFinancialDataInput {
  structureId: string;
  commissionRate: number;
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
    const { structureId, commissionRate } = input;

    // Obtener resumen financiero usando el servicio existente
    const financialResult = await FinancialSummaryService.get(structureId);
    const financialSummary = financialResult.isOk() ? financialResult.value : null;

    // Obtener apuestas pendientes del almacenamiento offline
    const pendingBets = await OfflineStorage.getPendingBets() || [];

    // Calcular totales diarios
    let dailyTotals: DailyTotals;

    if (financialSummary) {
      // Calcular desde el resumen financiero
      const baseTotals = this.financialCalculator.calculateFromSummary(financialSummary);

      // Agregar impacto de apuestas pendientes
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
      // Sin datos financieros, usar solo apuestas pendientes o valores vacíos
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