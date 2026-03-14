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

import { offlineStorage } from '@core/offline-storage/instance';
import { SystemOfflineKeys } from './financial.offline.keys';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('FinancialRepository');

// ============================================================================
// EVENT EMITTER PARA REACTIVIDAD
// ============================================================================

type Listener = () => void;
const listeners = new Set<Listener>();

/**
 * Notifica a todos los listeners de un cambio
 */
function notifyListeners(): void {
    listeners.forEach(listener => listener());
}

// ============================================================================
// STORAGE HELPERS
// ============================================================================

/**
 * Formatea un timestamp UTC a una cadena YYYY-MM-DD
 * (Lógica pura y pasiva para determinar la llave de almacenamiento)
 */
function formatUTCDate(timestamp: number): string {
    try {
        return new Date(timestamp).toISOString().split('T')[0];
    } catch (error) {
        return '1970-01-01';
    }
}

/**
 * Obtiene la llave del ledger para una fecha o timestamp específico
 */
function getStorageKey(dateOrTimestamp: string | number): string {
    if (typeof dateOrTimestamp === 'string') {
        return SystemOfflineKeys.ledger(dateOrTimestamp);
    }

    const dateStr = formatUTCDate(dateOrTimestamp);
    return SystemOfflineKeys.ledger(dateStr);
}

/**
 * Suscribe un listener a cambios en el ledger para una fecha específica
 */
export function onLedgerChange(listener: Listener, timestamp: number = Date.now()): () => void {
    listeners.add(listener);

    const currentKey = getStorageKey(timestamp);

    // Suscribirse a cambios en la llave indicada
    const unsubscribe = offlineStorage.subscribe((event) => {
        if (event.type === 'ENTITY_CHANGED' && event.entity === currentKey) {
            notifyListeners();
        }
    });

    return () => {
        listeners.delete(listener);
        unsubscribe();
    };
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

/**
 * Obtiene todas las transacciones del storage local para un momento específico
 */
async function getAllTransactions(timestamp: number): Promise<Transaction[]> {
    try {
        const key = getStorageKey(timestamp);
        const data = await offlineStorage.get<Transaction[]>(key);

        if (data && Array.isArray(data)) {
            return data;
        }

        return [];
    } catch (error) {
        log.error('Error reading transactions from storage', error);
        return [];
    }
}

/**
 * Guarda todas las transacciones en storage local para un momento específico
 */
async function saveAllTransactions(transactions: Transaction[], timestamp: number): Promise<void> {
    const key = getStorageKey(timestamp);
    await offlineStorage.set(key, transactions);
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
     * @param timestamp - Timestamp confiable de la transacción
     */
    async addTransaction(
        transaction: Pick<Transaction, 'origin' | 'amount' | 'type' | 'metadata'>,
        timestamp: number
    ): Promise<void> {
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

        const transactions = await getAllTransactions(timestamp);

        const newTransaction: Transaction = {
            ...transaction,
            timestamp
        };

        transactions.push(newTransaction);

        await saveAllTransactions(transactions, timestamp);
        notifyListeners();

        log.debug('Transaction added', {
            origin: transaction.origin,
            amount: transaction.amount,
            type: transaction.type
        });
    }

    /**
     * Registra múltiples transacciones en lote
     * @param transactions - Array de transacciones
     * @param timestamp - Timestamp confiable para el lote
     */
    async addTransactions(
        transactions: Pick<Transaction, 'origin' | 'amount' | 'type' | 'metadata'>[],
        timestamp: number
    ): Promise<void> {
        // Critical Validation for batch
        for (let i = 0; i < transactions.length; i++) {
            const t = transactions[i];
            if (t.amount <= 0 || !t.origin || !t.origin.startsWith('structure:')) {
                const errorMsg = `ERROR_CRITICO_BATCH_FINANCIERO: Item ${i} inválido (monto: ${t.amount}, origen: ${t.origin})`;
                log.error(errorMsg);
                throw new Error(errorMsg);
            }
        }

        const allTransactions = await getAllTransactions(timestamp);

        const newTransactions = transactions.map(t => ({
            ...t,
            timestamp
        }));

        allTransactions.push(...newTransactions);
        await saveAllTransactions(allTransactions, timestamp);
        notifyListeners();

        log.debug('Transactions batch added', { count: transactions.length });
    }

    /**
     * Elimina transacciones por origen (prefijo)
     * Útil para eliminar todas las transacciones de un sorteo
     * @param timestamp - Timestamp confiable
     * @param originPrefix - Prefijo del origen a eliminar (ej: "drawId:")
     */
    async removeTransactionsByOrigin(timestamp: number, originPrefix: string): Promise<number> {
        const allTransactions = await getAllTransactions(timestamp);
        const initialCount = allTransactions.length;

        const filtered = allTransactions.filter(t => !t.origin.startsWith(originPrefix));
        const removed = initialCount - filtered.length;

        await saveAllTransactions(filtered, timestamp);
        notifyListeners();

        log.debug('Transactions removed', { prefix: originPrefix, count: removed });
        return removed;
    }

    /**
     * Elimina una transacción específica por origen exacto
     * @param timestamp - Timestamp confiable
     * @param origin - Origen exacto de la transacción
     */
    async removeTransaction(timestamp: number, origin: string): Promise<boolean> {
        const allTransactions = await getAllTransactions(timestamp);
        const filtered = allTransactions.filter(t => t.origin !== origin);

        if (filtered.length < allTransactions.length) {
            await saveAllTransactions(filtered, timestamp);
            notifyListeners();
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
     * @param timestamp - Timestamp confiable
     * @param originFilter? - Filtrar por prefijo de origen (ej: "31:")
     */
    async getTotal(timestamp: number, originFilter?: string): Promise<number> {
        const transactions = await this.getTransactions(timestamp, originFilter);
        return transactions.reduce((sum, t) => {
            return sum + (t.type === 'credit' ? t.amount : -t.amount);
        }, 0);
    }

    /**
     * Obtiene la suma de créditos (entradas)
     * @param timestamp - Timestamp confiable
     * @param originFilter? - Filtrar por prefijo de origen
     */
    async getCredits(timestamp: number, originFilter?: string): Promise<number> {
        const transactions = await this.getTransactions(timestamp, originFilter);
        return transactions
            .filter(t => t.type === 'credit')
            .reduce((sum, t) => sum + t.amount, 0);
    }

    /**
     * Obtiene la suma de débitos (salidas)
     * @param timestamp - Timestamp confiable
     * @param originFilter? - Filtrar por prefijo de origen
     */
    async getDebits(timestamp: number, originFilter?: string): Promise<number> {
        const transactions = await this.getTransactions(timestamp, originFilter);
        return transactions
            .filter(t => t.type === 'debit')
            .reduce((sum, t) => sum + t.amount, 0);
    }

    /**
     * Obtiene el neto (créditos - débitos)
     * @param timestamp - Timestamp confiable
     * @param originFilter? - Filtrar por prefijo de origen
     */
    async getNet(timestamp: number, originFilter?: string): Promise<number> {
        return this.getTotal(timestamp, originFilter);
    }

    /**
     * Obtiene las comisiones calculadas sobre los créditos
     * @param timestamp - Timestamp confiable
     * @param rate - Tasa de comisión (default: 0.10 = 10%)
     * @param originFilter? - Filtrar por prefijo de origen
     */
    async getCommissions(timestamp: number, rate: number = 0.10, originFilter?: string): Promise<number> {
        const credits = await this.getCredits(timestamp, originFilter);
        return credits * rate;
    }

    /**
     * Obtiene breakdown detallado agrupado por drawId
     * @param timestamp - Timestamp confiable
     * @param drawIds - Lista opcional de IDs de sorteos para filtrar
     * @param originFilter - Opcional: Filtro por prefijo de origen (ej: structure:ID)
     * @returns Objeto con drawId como clave y objeto con credits, debits y net como valor
     */
    async getDetailedTotalsGroupedByDrawId(timestamp: number, drawIds?: string[], originFilter?: string): Promise<Record<string, { credits: number; debits: number; net: number; count: number }>> {
        const transactions = await this.getTransactions(timestamp, originFilter);
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
     * @param timestamp - Timestamp confiable
     * @param drawId - ID del sorteo
     */
    async getTotalByDrawId(timestamp: number, drawId: string): Promise<number> {
        return this.getTotal(timestamp, `${drawId}:`);
    }

    /**
     * Obtiene breakdown de totales agrupados por drawId, opcionalmente filtrado por una lista de IDs y un prefijo de origen
     * @param timestamp - Timestamp confiable
     * @param drawIds - Lista opcional de IDs de sorteos para filtrar
     * @param originFilter - Opcional: Filtro por prefijo de origen (ej: structure:ID)
     * @returns Objeto con drawId como clave y total como valor
     */
    async getTotalsGroupedByDrawId(timestamp: number, drawIds?: string[], originFilter?: string): Promise<Record<string, number>> {
        const transactions = await this.getTransactions(timestamp, originFilter);
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
     * @param timestamp - Timestamp confiable
     * @param originFilter? - Filtrar por prefijo de origen
     */
    async getAggregation(timestamp: number, originFilter?: string): Promise<FinancialAggregation> {
        const transactions = await this.getTransactions(timestamp, originFilter);

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
     * @param timestamp - Timestamp confiable
     * @param originFilter? - Filtrar por prefijo de origen
     */
    async getTransactions(timestamp: number, originFilter?: string): Promise<Transaction[]> {
        const all = await getAllTransactions(timestamp);

        if (!originFilter) return all;

        return all.filter(t => t.origin.startsWith(originFilter));
    }

    /**
     * Obtiene transacciones de un sorteo específico
     * @param timestamp - Timestamp confiable
     * @param drawId - ID del sorteo
     */
    async getTransactionsByDrawId(timestamp: number, drawId: string): Promise<Transaction[]> {
        return this.getTransactions(timestamp, `${drawId}:`);
    }

    // ============================================================================
    // OPERACIONES DE MANTENIMIENTO
    // ============================================================================

    /**
     * Limpia todas las transacciones de un momento específico
     * @param timestamp - Timestamp confiable
     */
    async clearAll(timestamp: number): Promise<void> {
        await saveAllTransactions([], timestamp);
        log.info('Transactions cleared for timestamp', { timestamp });
    }

    /**
     * Obtiene el conteo de transacciones
     * @param timestamp - Timestamp confiable
     */
    async getCount(timestamp: number): Promise<number> {
        const transactions = await getAllTransactions(timestamp);
        return transactions.length;
    }

    // ============================================================================
    // OPERACIONES DE LIMPIEZA (MANTENIMIENTO)
    // ============================================================================

    /**
     * Limpia datos financieros de días anteriores.
     * Conoce la estructura de sus keys y puede limpiar por fecha.
     * 
     * @param today - Fecha actual del servidor (YYYY-MM-DD)
     * @returns Número de keys eliminadas
     */
    async cleanup(today: string): Promise<number> {
        log.info('Starting FinancialRepository cleanup', { today });

        try {
            // Patrón: @v2:financial:ledger:YYYY-MM-DD:transactions
            const allKeys = await offlineStorage.query('@v2:financial:ledger:*').keys();

            const keysToDelete: string[] = [];

            for (const key of allKeys) {
                // Extraer la fecha de la clave: @v2:financial:ledger:2026-03-03:transactions
                const match = key.match(/@v2:financial:ledger:(\d{4}-\d{2}-\d{2})/);
                if (match) {
                    const keyDate = match[1];
                    if (keyDate < today) {
                        keysToDelete.push(key);
                    }
                }
            }

            if (keysToDelete.length > 0) {
                log.info('FinancialRepository cleanup: removing old ledger keys', {
                    count: keysToDelete.length,
                    keys: keysToDelete
                });

                await Promise.all(keysToDelete.map(key => offlineStorage.remove(key)));
            }

            log.info('FinancialRepository cleanup completed', { removed: keysToDelete.length });
            return keysToDelete.length;

        } catch (error) {
            log.error('FinancialRepository cleanup failed', error);
            throw error;
        }
    }

    // ============================================================================
    // HELPERS PRIVADOS
    // ============================================================================

    /**
     * Crea una transacción de crédito (entrada de dinero)
     * @param origin - Origen de la transacción
     * @param amount - Monto
     * @param timestamp - Timestamp confiable
     * @param metadata - Metadatos opcionales
     */
    async addCredit(origin: string, amount: number, timestamp: number, metadata?: Record<string, unknown>): Promise<void> {
        await this.addTransaction({
            origin,
            amount,
            type: 'credit',
            metadata
        }, timestamp);
    }

    /**
     * Crea una transacción de débito (salida de dinero)
     * @param origin - Origen de la transacción
     * @param amount - Monto
     * @param timestamp - Timestamp confiable
     * @param metadata - Metadatos opcionales
     */
    async addDebit(origin: string, amount: number, timestamp: number, metadata?: Record<string, unknown>): Promise<void> {
        await this.addTransaction({
            origin,
            amount,
            type: 'debit',
            metadata
        }, timestamp);
    }
}

// ============================================================================
// EXPORTAR INSTANCIA SINGLETON
// ============================================================================

export const financialRepository = new FinancialRepository();
