import { FinancialSummary, PendingBet, DailyTotals } from '../../domain/models';
import { TimeRangeService } from '../../domain/services/time-range.service';
import { SummaryPluginContext } from '../../domain/services';
import { financialRepository, FinancialKeys } from '@/shared/repositories/financial/ledger.repository';
import { FinancialSummaryExternalCodec, decodeOrFallback } from '../../domain/codecs';
import { logger } from '@/shared/utils/logger';
import { FinancialCalculatorService } from '../../domain/services/financial-calculator.service';

const log = logger.withTag('GET_FINANCIAL_DATA_USE_CASE');

export interface GetFinancialDataInput {
  structureId: string;
  commissionRate: number;
  context: SummaryPluginContext;
}

export interface GetFinancialDataResult {
  financialSummary: FinancialSummary | null;
  pendingBets: PendingBet[];
  dailyTotals: DailyTotals;
  offlineState?: {
    localTotalCollected: number;
    pendingSync: boolean;
    syncedCount: number;
  };
}

export class GetFinancialDataUseCase {
  constructor(
    private financialCalculator: FinancialCalculatorService,
    private timeRangeService: TimeRangeService
  ) { }

  async execute(input: GetFinancialDataInput): Promise<GetFinancialDataResult> {
    const { structureId, commissionRate, context } = input;

    // =========================================================================
    // ESTRATEGIA: Usar financialRepository como FUENTE ÚNICA DE VERDAD (SSOT)
    // =========================================================================
    // El frontend es el responsable de su propio estado financiero.
    // Los datos del servidor son solo para auditoría web y no se usan aquí.

    let repositoryTotalCollected = 0;
    let repositoryTotalPaid = 0;
    let betCount = 0;

    try {
      const filter = FinancialKeys.forStructure(structureId);

      // Obtener créditos (totalCollected) del Ledger local
      repositoryTotalCollected = await financialRepository.getCredits(filter);

      // Obtener débitos (totalPaid - premios) del Ledger local
      repositoryTotalPaid = await financialRepository.getDebits(filter);

      // Obtener el conteo de transacciones locales
      const transactions = await financialRepository.getTransactions(filter);
      betCount = transactions.length;

      log.debug('FinancialRepository totals (SSOT)', {
        structureId,
        totalCollected: repositoryTotalCollected,
        totalPaid: repositoryTotalPaid,
        betCount
      });
    } catch (error) {
      log.error('Error fetching from FinancialRepository', error);
    }

    // Ya no consultamos al servidor para conciliación. 
    // Las finanzas offline son la única fuente de verdad para el dashboard.
    const effectiveOfflineTotal = repositoryTotalCollected;
    const effectiveOfflinePaid = repositoryTotalPaid;

    // =========================================================================
    // Calcular DailyTotals desde datos locales (fuente autoritativa)
    // =========================================================================

    let dailyTotals: DailyTotals;

    // If we have offline data, use it as primary source
    if (effectiveOfflineTotal > 0 || betCount > 0) {
      dailyTotals = {
        totalCollected: effectiveOfflineTotal,
        premiumsPaid: effectiveOfflinePaid,
        netResult: effectiveOfflineTotal - effectiveOfflinePaid,
        estimatedCommission: effectiveOfflineTotal * commissionRate,
        amountToRemit: effectiveOfflineTotal * (1 - commissionRate)
      };
    } else {
      // No data at all - return zeros
      dailyTotals = this.getEmptyTotals();
    }

    return {
      financialSummary: {
        totalCollected: dailyTotals.totalCollected,
        premiumsPaid: dailyTotals.premiumsPaid,
        estimatedCommission: dailyTotals.estimatedCommission,
        timestamp: Date.now()
      },
      pendingBets: [], // Ya no usamos OfflineFinancialService para esto
      dailyTotals,
      offlineState: {
        localTotalCollected: effectiveOfflineTotal,
        pendingSync: betCount > 0,
        syncedCount: betCount
      }
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
