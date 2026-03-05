// Caso de uso simplificado para obtener datos financieros usando servicios existentes
import { FinancialSummary, PendingBet, DailyTotals } from '../../domain/models';
import { FinancialCalculatorService } from '../../domain/services/financial-calculator.service';
import { TimeRangeService } from '../../domain/services/time-range.service';
import { betRepository } from '@/shared/repositories/bet/bet.repository';
import { TimerRepository } from '@/shared/repositories/system/time/timer.repository';
import { logger } from '@/shared/utils/logger';

import { SummaryPluginContext } from '../../domain/services';

const log = logger.withTag('GET_FINANCIAL_DATA');

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

    // Obtener hora confiable del servidor para el cálculo on-demand
    const trustedNow = await TimerRepository.getTrustedNow(Date.now());
    const trustedDate = new Date(trustedNow);
    const todayStart = new Date(
      trustedDate.getFullYear(),
      trustedDate.getMonth(),
      trustedDate.getDate()
    ).getTime();

    log.info('Calculating financial data on-demand', { structureId, todayStart });

    // Obtener resumen financiero calculado on-demand desde BetRepository
    const summary = await betRepository.getFinancialSummary(todayStart, structureId);

    // Mapear al formato esperado por la UI
    const financialSummary: FinancialSummary | null = summary.totalCollected > 0 ? {
      totalCollected: summary.totalCollected,
      premiumsPaid: summary.premiumsPaid,
      estimatedCommission: summary.totalCollected * commissionRate,
      timestamp: Date.now()
    } : null;

    // Obtener apuestas pendientes del almacenamiento offline
    const pendingBetsRepo = await betRepository.getPendingBets();
    const pendingBets: PendingBet[] = pendingBetsRepo.map(b => ({
      id: b.externalId || (b as any).offlineId,
      amount: Number(b.amount ?? (b as any).data?.amount) || 0,
      timestamp: b.timestamp,
      status: 'pending'
    }));

    // Calcular totales diarios
    let dailyTotals: DailyTotals;

    if (financialSummary) {
      // Calcular desde el resumen financiero
      const baseTotals = this.financialCalculator.calculateFromSummary(financialSummary);

      // Agregar impacto de apuestas pendientes
      if (pendingBets.length > 0) {
        const todayRange = this.timeRangeService.getTodayRange(trustedNow);
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
        const todayRange = this.timeRangeService.getTodayRange(trustedNow);
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