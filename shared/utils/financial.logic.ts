/**
 * Lógica pura de cálculo financiero compartida entre el Core y los Plugins.
 * Sin efectos secundarios, sin dependencias de infraestructura.
 */

export interface RawFinancialData {
    totalCollected: number;
    premiumsPaid: number;
    betCount: number;
}

export interface FinancialSummaryResult {
    totalCollected: number;
    premiumsPaid: number;
    estimatedCommission: number;
    timestamp: number;
}

export interface DailyTotalsResult {
    totalCollected: number;
    premiumsPaid: number;
    netResult: number;
    estimatedCommission: number;
    amountToRemit: number;
}

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
): { summary: FinancialSummaryResult; totals: DailyTotalsResult } => {
    const totalCollected = Number(data.totalCollected) || 0;
    const premiumsPaid = Number(data.premiumsPaid) || 0;

    // Asegurar que la tasa sea decimal (ej: 30 -> 0.3) si viene como entero
    const safeRate = commissionRate > 1 ? commissionRate / 100 : Number(commissionRate) || 0;

    const estimatedCommission = totalCollected * safeRate;
    const netResult = totalCollected - premiumsPaid - estimatedCommission;

    const summary: FinancialSummaryResult = {
        totalCollected,
        premiumsPaid,
        estimatedCommission,
        timestamp: Date.now(),
    };

    const totals: DailyTotalsResult = {
        totalCollected,
        premiumsPaid,
        netResult,
        estimatedCommission,
        amountToRemit: totalCollected - estimatedCommission,
    };

    return { summary, totals };
};
