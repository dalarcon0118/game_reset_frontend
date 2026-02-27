import { FinancialSummary, PendingBet, DailyTotals } from '../../domain/models';
import { FinancialCalculatorService } from '../../domain/services/financial-calculator.service';
import { TimeRangeService } from '../../domain/services/time-range.service';
import { SummaryPluginContext } from '../../domain/services';
import { OfflineFinancialService } from '@/shared/services/offline';
import { FinancialSummaryExternalCodec, decodeOrFallback } from '../../domain/codecs';
import { logger } from '@/shared/utils/logger';

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

    // Obtener resumen financiero usando el servicio del contexto
    let financialSummary: FinancialSummary | null = null;
    try {
      // Usamos context.api.get directamente para evitar depender de inyección de servicios específicos
      // Construimos la URL manualmente basada en el endpoint conocido
      const today = new Date().toISOString().split('T')[0];
      const endpoint = `financial-statement/summary/?structure_id=${structureId}&date=${today}`;

      const dataRaw = await context.api.get<any>(endpoint);

      if (dataRaw) {
        // Validar y decodificar datos financieros con io-ts
        const data = decodeOrFallback(
          FinancialSummaryExternalCodec,
          dataRaw,
          'FinancialSummary',
          { totalCollected: 0, premiumsPaid: 0 }
        );

        financialSummary = {
          totalCollected: data.totalCollected,
          premiumsPaid: data.premiumsPaid,
          estimatedCommission: 0, // Se calcula después
          timestamp: Date.now()
        };
      }
    } catch (error) {
      log.error('Error fetching financial summary', error);
      // No lanzamos el error para permitir que la UI muestre datos parciales u offline
    }

    // Si no se pudo obtener el resumen, inicializar con valores en cero
    if (!financialSummary) {
      log.warn('Could not fetch financial summary, defaulting to zeros');
      financialSummary = {
        totalCollected: 0,
        premiumsPaid: 0,
        estimatedCommission: 0,
        timestamp: Date.now()
      };
    }

    // =========================================================================
    // INTEGRACIÓN OFFLINE-FINANCIAL-SERVICE
    // =========================================================================
    // Obtener estado financiero offline para todos los sorteos
    let offlineTotalCollected = 0;
    let hasOfflineChanges = false;
    let syncedCount = 0;
    const offlineDrawIds = new Set<string>();

    // Store V2 bets here to avoid double fetching
    let v2PendingBets: any[] = [];

    try {
      // Obtener todas las apuestas pendientes del nuevo sistema offline
      v2PendingBets = await OfflineFinancialService.getPendingBets();

      for (const bet of v2PendingBets) {
        if (bet.financialImpact && bet.status !== 'synced') {
          // Safely convert to number, default to 0 if null/undefined/NaN
          const amount = Number(bet.financialImpact.totalCollected) || 0;
          offlineTotalCollected += amount;
          hasOfflineChanges = true;
        }
        if (bet.drawId) {
          offlineDrawIds.add(bet.drawId);
        }
        if (bet.status === 'synced') {
          syncedCount++;
        }
      }

      log.debug('Offline totals', {
        pendingCount: v2PendingBets.length,
        offlineTotalCollected,
        hasOfflineChanges
      });
    } catch (error) {
      log.error('Error fetching offline state', error);
    }

    // Use only V2 OfflineFinancialService (Single Source of Truth)
    // Map V2 bets to Local Domain PendingBet
    // Filter out synced bets as they are already in the server summary
    const allPendingBets: PendingBet[] = v2PendingBets
      .filter(bet => bet.status !== 'synced')
      .map(bet => ({
        id: String(bet.offlineId || ''),
        amount: Number(bet.amount || 0),
        timestamp: Number(bet.timestamp || Date.now()),
        status: 'pending' as const
      }));

    let dailyTotals: DailyTotals;

    if (financialSummary) {
      // Combinar server state con totales offline
      const serverTotal = financialSummary.totalCollected;
      const combinedTotal = serverTotal + offlineTotalCollected;

      const baseTotals = this.financialCalculator.calculateFromSummary({
        ...financialSummary,
        totalCollected: combinedTotal
      });

      if (hasOfflineChanges) {
        const todayRange = this.timeRangeService.getTodayRange();
        const pendingImpact = this.financialCalculator.calculatePendingImpact(
          allPendingBets,
          commissionRate,
          todayRange
        );

        dailyTotals = this.financialCalculator.combineTotals(baseTotals, pendingImpact);
      } else {
        dailyTotals = baseTotals;
      }
    } else {
      // Solo tenemos datos offline
      if (allPendingBets.length > 0 || offlineTotalCollected > 0) {
        // Calcular desde cero con datos offline
        dailyTotals = {
          totalCollected: offlineTotalCollected,
          premiumsPaid: 0,
          netResult: offlineTotalCollected * (1 - commissionRate),
          estimatedCommission: offlineTotalCollected * commissionRate,
          amountToRemit: offlineTotalCollected * (1 - commissionRate)
        };
      } else {
        dailyTotals = this.getEmptyTotals();
      }
    }

    return {
      financialSummary,
      pendingBets: allPendingBets,
      dailyTotals,
      offlineState: {
        localTotalCollected: offlineTotalCollected,
        pendingSync: hasOfflineChanges,
        syncedCount
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
