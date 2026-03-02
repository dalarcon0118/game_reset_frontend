/**
 * Financial Repository - Barrel Export
 * 
 * Punto de entrada unificado para todo el sistema financiero.
 * 
 * ARQUITECTURA:
 * - Ledger (datos locales/offline): Transacciones financieras calculadas localmente
 * - Service (datos remotos): Comunicación con backend
 * - Summary (caché): Resúmenes con fallback offline
 * 
 * FLUJO DE DATOS:
 * 1. UI → Ledger (addCredit, addDebit, getTotal, etc.)
 * 2. Ledger → Service (sync al backend cuando hay conexión)
 * 3. Service → UI (datos históricos del servidor)
 */

// ============================================================================
// LEDGER - Datos Locales (Offline-First)
// ============================================================================

export {
    FinancialRepository,
    financialRepository
} from './ledger.repository';

export type {
    Transaction,
    TransactionType,
    TransactionOrigin,
    FinancialAggregation
} from './ledger.repository';

// Re-export del event emitter para reactividad
export { onLedgerChange } from './ledger.repository';

// ============================================================================
// SERVICE - Datos Remotos (Backend API)
// ============================================================================

export {
    FinancialSummaryService
} from './service';

// (NodeFinancialSummary se exporta desde api/types)

// ============================================================================
// SUMMARY - Caché Offline
// ============================================================================

export {
    summaryRepository,
    OfflineFirstSummaryRepository
} from './summary.repository';

export type {
    ISummaryRepository
} from './summary.repository';

// ============================================================================
// API - Tipos y Códers (Interno)
// ============================================================================

export type {
    BackendFinancialSummary,
    NodeFinancialSummary,
    BackendDashboardStats,
    BackendFinancialStatement
} from './api/types';

export {
    BackendFinancialSummaryCodec,
    NodeFinancialSummaryCodec,
    BackendDashboardStatsCodec,
    BackendFinancialStatementCodec,
    BackendFinancialStatementArrayCodec,
    decodeOrFallback
} from './api/codecs';

export {
    FinancialSummaryApi
} from './api/api';
