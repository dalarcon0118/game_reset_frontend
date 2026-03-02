/**
 * FinancialRepository - Ledger Genérico para Estado Financiero
 * 
 * Esta clase es AGNÓSTICA al dominio (no conoce apuestas ni sorteos).
 * Funciona como un libro mayor (ledger) de transacciones financieras.
 * 
 * ARQUITECTURA OFFLINE-FIRST:
 * - Almacena transacciones simples en IndexedDB
 * - Calcula totales mediante operaciones matemáticas locales
 * - No depende del backend para cálculos
 * 
 * ESTRUCTURA DE DATOS:
 * - TransactionOrigin: "drawId:betId" (composite key)
 * - Transaction: { origin, amount, type: 'credit'|'debit', timestamp }
 * 
 * MÉTODOS:
 * - addTransaction(): Registra una transacción
 * - getTotal(): Suma total (créditos - débitos)
 * - getCredits(): Suma de créditos
 * - getDebits(): Suma de débitos
 * - getNet(): Neto (créditos - débitos)
 * - getCommissions(): Comisiones calculadas
 * - getTotalByDrawId(id): Total filtrado por sorteo
 */

import storageClient from '@/shared/core/offline-storage/storage_client';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('FinancialRepository');

// ============================================================================
// EVENT EMITTER PARA REACTIVIDAD
// ============================================================================

type Listener = () => void;
const listeners = new Set<Listener>();

/**
 * Suscribe un listener a cambios en el ledger
 * Retorna función para desuscribirse
 */
export function onLedgerChange(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/**
 * Notifica a todos los listeners de un cambio
 */
function notifyListeners(): void {
    listeners.forEach(listener => listener());
}

// ============================================================================
// TIPOS - TOTALMENTE AGNÓSTICOS AL DOMINIO
// ============================================================================

/**
 * Origen de la transacción: identificador único de la fuente
 * Formato estándar: "structure:ID:draw:ID:bet:ID"
 */
export type TransactionOrigin = string;

/**
 * Utilidades para la generación de llaves jerárquicas del Ledger.
 * Permite filtrado multinivel: Estructura > Sorteo > Apuesta.
 */
export const FinancialKeys = {
    /** Llave raíz para una estructura/banco */
    forStructure: (id: string | number) => `structure:${id}`,

    /** Llave para un sorteo dentro de una estructura */
    forDraw: (structureId: string | number, drawId: string | number) =>
        `structure:${structureId}:draw:${drawId}`,

    /** Llave única para una apuesta específica */
    forBet: (structureId: string | number, drawId: string | number, betId: string) =>
        `structure:${structureId}:draw:${drawId}:bet:${betId}`,

    /** Extrae el drawId de un origen jerárquico */
    extractDrawId: (origin: string): string | null => {
        const match = origin.match(/:draw:([^:]+)/);
        return match ? match[1] : null;
    }
};

/**
 * Tipo de transacción financiera
 */
export type TransactionType = 'credit' | 'debit';

/**
 * Transacción financiera - estructura genérica
 */
export interface Transaction {
    origin: TransactionOrigin;
    amount: number;
    type: TransactionType;
    timestamp: number;
    metadata?: Record<string, unknown>;
}

/**
 * Resultado de agregación financiera
 */
export interface FinancialAggregation {
    total: number;
    credits: number;
    debits: number;
    count: number;
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEY = 'financial_transactions';

// ============================================================================
// METODOS DE STORAGE (IndexedDB)
// ============================================================================

/**
 * Obtiene todas las transacciones del storage local
 */
async function getAllTransactions(): Promise<Transaction[]> {
    try {
        const data = await storageClient.get(STORAGE_KEY);
        return Array.isArray(data) ? data : [];
    } catch (error) {
        log.error('Error reading transactions from storage', error);
        return [];
    }
}

/**
 * Guarda todas las transacciones en storage local
 */
async function saveAllTransactions(transactions: Transaction[]): Promise<void> {
    await storageClient.set(STORAGE_KEY, transactions);
}

// ============================================================================
// CLASE PRINCIPAL - FINANCIAL REPOSITORY
// ============================================================================

export class FinancialRepository {

    // ============================================================================
    // OPERACIONES DE TRANSACCIÓN (CRUD)
    // ============================================================================

    /**
     * Registra una nueva transacción
     * @param transaction - Transacción a registrar (sin timestamp)
     */
    async addTransaction(transaction: Pick<Transaction, 'origin' | 'amount' | 'type' | 'metadata'>): Promise<void> {
        // Critical Validation: Amount > 0
        if (transaction.amount <= 0) {
            const errorMsg = `ERROR_CRITICO_FINANCIERO: Intento de registrar transacción con monto <= 0 (${transaction.amount}). Origen: ${transaction.origin}`;
            log.error(errorMsg);
            throw new Error(errorMsg);
        }

        // Critical Validation: Origin must contain structure info (mandatory for hierarchy)
        if (!transaction.origin || !transaction.origin.startsWith('structure:')) {
            const errorMsg = `ERROR_CRITICO_FINANCIERO: El origen de la transacción debe incluir la estructura ("structure:ID"). Origen recibido: ${transaction.origin}`;
            log.error(errorMsg);
            throw new Error(errorMsg);
        }

        const transactions = await getAllTransactions();

        const newTransaction: Transaction = {
            ...transaction,
            timestamp: Date.now()
        };

        transactions.push(newTransaction);

        await saveAllTransactions(transactions);

        log.debug('Transaction added', {
            origin: transaction.origin,
            amount: transaction.amount,
            type: transaction.type
        });

        // Notificar a listeners de cambio
        notifyListeners();
    }

    /**
     * Registra múltiples transacciones en lote
     * @param transactions - Array de transacciones
     */
    async addTransactions(transactions: Pick<Transaction, 'origin' | 'amount' | 'type' | 'metadata'>[]): Promise<void> {
        // Critical Validation for batch
        for (let i = 0; i < transactions.length; i++) {
            const t = transactions[i];
            if (t.amount <= 0 || !t.origin || !t.origin.startsWith('structure:')) {
                const errorMsg = `ERROR_CRITICO_BATCH_FINANCIERO: Item ${i} inválido (monto: ${t.amount}, origen: ${t.origin})`;
                log.error(errorMsg);
                throw new Error(errorMsg);
            }
        }

        const allTransactions = await getAllTransactions();
        const timestamp = Date.now();

        const newTransactions = transactions.map(t => ({
            ...t,
            timestamp
        }));

        allTransactions.push(...newTransactions);
        await saveAllTransactions(allTransactions);

        log.debug('Transactions batch added', { count: transactions.length });
    }

    /**
     * Elimina transacciones por origen (prefijo)
     * Útil para eliminar todas las transacciones de un sorteo
     * @param originPrefix - Prefijo del origen a eliminar (ej: "drawId:")
     */
    async removeTransactionsByOrigin(originPrefix: string): Promise<number> {
        const allTransactions = await getAllTransactions();
        const initialCount = allTransactions.length;

        const filtered = allTransactions.filter(t => !t.origin.startsWith(originPrefix));
        const removed = initialCount - filtered.length;

        await saveAllTransactions(filtered);

        log.debug('Transactions removed', { prefix: originPrefix, count: removed });
        return removed;
    }

    /**
     * Elimina una transacción específica por origen exacto
     * @param origin - Origen exacto de la transacción
     */
    async removeTransaction(origin: string): Promise<boolean> {
        const allTransactions = await getAllTransactions();
        const filtered = allTransactions.filter(t => t.origin !== origin);

        if (filtered.length < allTransactions.length) {
            await saveAllTransactions(filtered);
            log.debug('Transaction removed', { origin });
            return true;
        }

        return false;
    }

    // ============================================================================
    // CONSULTAS AGREGADAS (MATH - 100% OFFLINE)
    // ============================================================================

    /**
     * Obtiene el total de transacciones (créditos - débitos)
     * @param originFilter? - Filtrar por prefijo de origen (ej: "31:")
     */
    async getTotal(originFilter?: string): Promise<number> {
        const transactions = await this.getTransactions(originFilter);
        return transactions.reduce((sum, t) => {
            return sum + (t.type === 'credit' ? t.amount : -t.amount);
        }, 0);
    }

    /**
     * Obtiene la suma de créditos (entradas)
     * @param originFilter? - Filtrar por prefijo de origen
     */
    async getCredits(originFilter?: string): Promise<number> {
        const transactions = await this.getTransactions(originFilter);
        return transactions
            .filter(t => t.type === 'credit')
            .reduce((sum, t) => sum + t.amount, 0);
    }

    /**
     * Obtiene la suma de débitos (salidas)
     * @param originFilter? - Filtrar por prefijo de origen
     */
    async getDebits(originFilter?: string): Promise<number> {
        const transactions = await this.getTransactions(originFilter);
        return transactions
            .filter(t => t.type === 'debit')
            .reduce((sum, t) => sum + t.amount, 0);
    }

    /**
     * Obtiene el neto (créditos - débitos)
     * @param originFilter? - Filtrar por prefijo de origen
     */
    async getNet(originFilter?: string): Promise<number> {
        const credits = await this.getCredits(originFilter);
        const debits = await this.getDebits(originFilter);
        return credits - debits;
    }

    /**
     * Obtiene las comisiones calculadas sobre los créditos
     * @param rate - Tasa de comisión (default: 0.10 = 10%)
     * @param originFilter? - Filtrar por prefijo de origen
     */
    async getCommissions(rate: number = 0.10, originFilter?: string): Promise<number> {
        const credits = await this.getCredits(originFilter);
        return credits * rate;
    }

    /**
     * Obtiene breakdown detallado de totales (créditos y débitos) agrupados por drawId
     * @param drawIds - Lista opcional de IDs de sorteos para filtrar
     * @param originFilter - Opcional: Filtro por prefijo de origen (ej: structure:ID)
     * @returns Objeto con drawId como clave y objeto con credits, debits y net como valor
     */
    async getDetailedTotalsGroupedByDrawId(drawIds?: string[], originFilter?: string): Promise<Record<string, { credits: number; debits: number; net: number; count: number }>> {
        const transactions = await this.getTransactions(originFilter);
        const grouped: Record<string, { credits: number; debits: number; net: number; count: number }> = {};

        const filterSet = drawIds ? new Set(drawIds) : null;

        for (const t of transactions) {
            let drawId = FinancialKeys.extractDrawId(t.origin);

            if (!drawId) {
                const parts = t.origin.split(':');
                if (parts.length >= 1 && !t.origin.startsWith('structure:')) {
                    drawId = parts[0];
                }
            }

            if (!drawId) continue;
            if (filterSet && !filterSet.has(drawId)) continue;

            if (!grouped[drawId]) {
                grouped[drawId] = { credits: 0, debits: 0, net: 0, count: 0 };
            }

            if (t.type === 'credit') {
                grouped[drawId].credits += t.amount;
            } else {
                grouped[drawId].debits += t.amount;
            }
            grouped[drawId].net = grouped[drawId].credits - grouped[drawId].debits;
            grouped[drawId].count += 1;
        }
        return grouped;
    }

    /**
     * Obtiene el total de transacciones filtrado por drawId
     * Busca transacciones con origen "drawId:*"
     * @param drawId - ID del sorteo
     */
    async getTotalByDrawId(drawId: string): Promise<number> {
        return this.getTotal(`${drawId}:`);
    }

    /**
     * Obtiene breakdown de totales agrupados por drawId, opcionalmente filtrado por una lista de IDs y un prefijo de origen
     * @param drawIds - Lista opcional de IDs de sorteos para filtrar
     * @param originFilter - Opcional: Filtro por prefijo de origen (ej: structure:ID)
     * @returns Objeto con drawId como clave y total como valor
     */
    async getTotalsGroupedByDrawId(drawIds?: string[], originFilter?: string): Promise<Record<string, number>> {
        const transactions = await this.getTransactions(originFilter);
        const grouped: Record<string, number> = {};

        // Convertir array a Set para búsqueda O(1) si hay muchos IDs
        const filterSet = drawIds ? new Set(drawIds) : null;

        for (const t of transactions) {
            // Extraer drawId del origen jerárquico "structure:ID:draw:ID:bet:ID"
            let drawId = FinancialKeys.extractDrawId(t.origin);

            // Fallback para soporte de datos antiguos (legacy) "drawId:betId"
            if (!drawId) {
                const parts = t.origin.split(':');
                if (parts.length >= 1 && !t.origin.startsWith('structure:')) {
                    drawId = parts[0];
                }
            }

            if (!drawId) continue;

            // Si hay filtro, ignorar si no está en la lista
            if (filterSet && !filterSet.has(drawId)) continue;

            const sign = t.type === 'credit' ? 1 : -1;
            grouped[drawId] = (grouped[drawId] || 0) + (t.amount * sign);
        }
        return grouped;
    }

    /**
     * Obtiene agregación completa
     * @param originFilter? - Filtrar por prefijo de origen
     */
    async getAggregation(originFilter?: string): Promise<FinancialAggregation> {
        const transactions = await this.getTransactions(originFilter);

        const credits = transactions
            .filter(t => t.type === 'credit')
            .reduce((sum, t) => sum + t.amount, 0);

        const debits = transactions
            .filter(t => t.type === 'debit')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            total: credits - debits,
            credits,
            debits,
            count: transactions.length
        };
    }

    // ============================================================================
    // CONSULTAS DE HISTÓRICO
    // ============================================================================

    /**
     * Obtiene todas las transacciones
     * @param originFilter? - Filtrar por prefijo de origen
     */
    async getTransactions(originFilter?: string): Promise<Transaction[]> {
        const all = await getAllTransactions();

        if (!originFilter) return all;

        return all.filter(t => t.origin.startsWith(originFilter));
    }

    /**
     * Obtiene transacciones de un sorteo específico
     * @param drawId - ID del sorteo
     */
    async getTransactionsByDrawId(drawId: string): Promise<Transaction[]> {
        return this.getTransactions(`${drawId}:`);
    }

    // ============================================================================
    // OPERACIONES DE MANTENIMIENTO
    // ============================================================================

    /**
     * Limpia todas las transacciones
     * Útil para testing o reset
     */
    async clearAll(): Promise<void> {
        await saveAllTransactions([]);
        log.info('All transactions cleared');
    }

    /**
     * Obtiene el conteo de transacciones
     */
    async getCount(): Promise<number> {
        const transactions = await getAllTransactions();
        return transactions.length;
    }

    // ============================================================================
    // HELPERS PRIVADOS
    // ============================================================================

    /**
     * Crea una transacción de crédito (entrada de dinero)
     * Método helper para facilitar uso
     */
    async addCredit(origin: string, amount: number, metadata?: Record<string, unknown>): Promise<void> {
        await this.addTransaction({
            origin,
            amount,
            type: 'credit',
            metadata
        });
    }

    /**
     * Crea una transacción de débito (salida de dinero)
     * Método helper para facilitar uso
     */
    async addDebit(origin: string, amount: number, metadata?: Record<string, unknown>): Promise<void> {
        await this.addTransaction({
            origin,
            amount,
            type: 'debit',
            metadata
        });
    }
}

// ============================================================================
// EXPORTAR INSTANCIA SINGLETON
// ============================================================================

export const financialRepository = new FinancialRepository();
