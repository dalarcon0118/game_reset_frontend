import { FinancialSummary, DailyTotals } from './models';
import { calculateFinancials as sharedCalculateFinancials, RawFinancialData as SharedRawFinancialData } from '@/shared/utils/financial.logic';

export type RawFinancialData = SharedRawFinancialData;

/**
 * Calcula el resumen financiero y totales diarios a partir de datos crudos y una tasa de comisión.
 * REGLA DE NEGOCIO:
 * - Neto = Recogido - Premios - Comisión
 * - Comisión = Recogido * tasa
 * - Remitir = Recogido - Comisión
 */
export const calculateFinancials = (
  data: RawFinancialData,
  commissionRate: number
): { summary: FinancialSummary; totals: DailyTotals } => {
  const result = sharedCalculateFinancials(data, commissionRate);

  // Mapeamos a los tipos internos del plugin si es necesario (son compatibles)
  return {
    summary: {
      ...result.summary,
    } as FinancialSummary,
    totals: {
      ...result.totals,
    } as DailyTotals
  };
};
