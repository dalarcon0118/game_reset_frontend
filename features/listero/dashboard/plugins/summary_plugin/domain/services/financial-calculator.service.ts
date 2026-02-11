// Servicio de cálculos financieros - Lógica pura sin efectos secundarios
import { FinancialSummary, PendingBet, DailyTotals, TimeRange } from '../models';

export class FinancialCalculatorService {
  /**
   * Calcula los totales diarios a partir del resumen financiero
   * @param summary Resumen financiero del día
   * @returns Totales calculados
   */
  calculateFromSummary(summary: FinancialSummary): DailyTotals {
    const { totalCollected, premiumsPaid, estimatedCommission } = summary;
    
    return {
      totalCollected,
      premiumsPaid,
      netResult: totalCollected - premiumsPaid,
      estimatedCommission,
      amountToRemit: totalCollected - premiumsPaid - estimatedCommission
    };
  }

  /**
   * Calcula el impacto de apuestas pendientes en los totales
   * @param bets Apuestas pendientes
   * @param commissionRate Tasa de comisión (0-1)
   * @param timeRange Rango de tiempo para filtrar
   * @returns Impacto en totales
   */
  calculatePendingImpact(
    bets: PendingBet[], 
    commissionRate: number, 
    timeRange: TimeRange
  ): DailyTotals {
    return bets
      .filter(bet => this.isWithinTimeRange(bet.timestamp, timeRange))
      .reduce((acc, bet) => {
        const amount = Number(bet.amount) || 0;
        const commission = amount * commissionRate;
        
        return {
          totalCollected: acc.totalCollected + amount,
          premiumsPaid: acc.premiumsPaid, // Las apuestas pendientes no pagan premios aún
          netResult: acc.netResult + amount,
          estimatedCommission: acc.estimatedCommission + commission,
          amountToRemit: acc.amountToRemit + (amount - commission)
        };
      }, this.getEmptyTotals());
  }

  /**
   * Combina múltiples totales en uno solo
   */
  combineTotals(...totals: DailyTotals[]): DailyTotals {
    return totals.reduce((acc, current) => ({
      totalCollected: acc.totalCollected + current.totalCollected,
      premiumsPaid: acc.premiumsPaid + current.premiumsPaid,
      netResult: acc.netResult + current.netResult,
      estimatedCommission: acc.estimatedCommission + current.estimatedCommission,
      amountToRemit: acc.amountToRemit + current.amountToRemit
    }), this.getEmptyTotals());
  }

  private isWithinTimeRange(timestamp: number, range: TimeRange): boolean {
    return timestamp >= range.start && timestamp < range.end;
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