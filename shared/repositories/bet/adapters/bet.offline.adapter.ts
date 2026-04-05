import { IBetStorage, BetDomainModel } from '../bet.types';
import { offlineStorage } from '@core/offline-storage/instance';
import { OfflineStorageKeyManager } from '@core/offline-storage/utils';
import { logger } from '@/shared/utils/logger';
import { BET_KEYS, BET_LOG_TAGS, BET_LOGS, BET_VALUES } from '../bet.constants';

const log = logger.withTag(BET_LOG_TAGS.OFFLINE_ADAPTER);

const BetOfflineKeys = {
    bet: (id: string) => OfflineStorageKeyManager.generateKey(BET_KEYS.STORAGE_ENTITY, BET_KEYS.STORAGE_STATUS_PENDING, id, BET_KEYS.STORAGE_DATA_TYPE),
    totalSales: (drawId: string | number) => OfflineStorageKeyManager.generateKey(BET_KEYS.STORAGE_ENTITY, 'balance', String(drawId), BET_KEYS.STORAGE_KEY_TOTAL_SALES),
    getPattern: (entity: string = BET_KEYS.STORAGE_STATUS_PENDING, id: string = '*') => OfflineStorageKeyManager.getPattern(BET_KEYS.STORAGE_ENTITY, entity, id, BET_KEYS.STORAGE_DATA_TYPE),
};

/**
 * SSOT: Genera la clave de identidad semántica de una apuesta para deduplicación.
 *
 * Prioridad: externalId > receiptCode > id
 * - externalId: UUID único por apuesta (fuente canónica)
 * - receiptCode: compartido por todo el lote — NO usar como clave primaria
 * - id: fallback al ID del backend o UI
 */
export function buildBetDedupKey(bet: {
    externalId?: string;
    receiptCode?: string;
    id?: string | number;
}): string {
    const externalId = String(bet.externalId || '').trim();
    const receiptCode = String(bet.receiptCode || '').trim();

    if (externalId) return `ext:${externalId}`;
    if (receiptCode) return `rc:${receiptCode}`;
    return `id:${String(bet.id || '').trim()}`;
}

/**
 * Adaptador de almacenamiento offline para apuestas que utiliza el motor agnóstico
 * Cumple con el puerto IBetStorage definido en el dominio de apuestas.
 * 
 * FASE 1 FIX: Implementa deduplicación de getAll() con cache y mutex
 */
export class BetOfflineAdapter implements IBetStorage {
    // Cache en memoria para evitar lecturas repetidas del storage
    private _cache: { data: BetDomainModel[]; timestamp: number } | null = null;
    private static readonly CACHE_TTL_MS = 5000; // 5 segundos

    // Mutex para prevenir reentradas concurrentes en getAll()
    private _ongoingRetrieval: Promise<BetDomainModel[]> | null = null;

    // Contador de deduplicaciones para métricas
    private _dedupCounter = 0;

    /**
     * Guarda o actualiza una apuesta en el almacenamiento offline
     */
    async save(bet: BetDomainModel): Promise<void> {
        const id = bet.externalId || (bet as any).offlineId;
        const key = BetOfflineKeys.bet(id);
        log.info(`[${BET_LOG_TAGS.OFFLINE_ADAPTER}] ${BET_LOGS.SAVING_BET}: ${id} (Estado: ${bet.status})`);
        log.info(`[FINGERPRINT_DEBUG] Saving bet with fingerprint:`, {
            betId: id,
            hasFingerprint: !!bet.fingerprint,
            fingerprint: bet.fingerprint,
            betKeys: Object.keys(bet)
        });
        // Sin TTL - las apuestas pendientes persisten hasta sincronización manual
        await offlineStorage.set(key, bet);
        // FASE 1 FIX: Invalidar cache después de modificar datos
        this.invalidateCache();
    }

    /**
     * Guarda un lote de apuestas en una sola operación con lógica de Upsert inteligente.
     * SSOT COMPLIANT: Preserva el fingerprint y otros campos críticos del storage local
     * cuando el API retorna datos nulos o degradados.
     */
    async saveBatch(bets: BetDomainModel[]): Promise<void> {
        log.info(`[${BET_LOG_TAGS.OFFLINE_ADAPTER}] ${BET_LOGS.SAVING_BATCH}: ${bets.length} apuestas (Upsert Mode).`);

        // 1. Limpiar entradas que van a ser reemplazadas por este lote (Upsert)
        await this.cleanupOrphanedEntries(bets);

        // 2. SSOT FIX: Antes de guardar, preservar campos críticos de bets existentes
        // El API puede retornar nulls (numbers_played, fingerprint_data) que sobrescribirían
        // datos válidos del storage local. Siempre preservar del storage local si existe.
        const betsWithPreservedFields = await Promise.all(bets.map(async (incomingBet) => {
            const existingBet = await offlineStorage.get<BetDomainModel>(BetOfflineKeys.bet(incomingBet.externalId));
            if (existingBet && existingBet.fingerprint && !incomingBet.fingerprint) {
                log.info(`[SSOT_FIX] Preserving fingerprint from local storage for bet ${incomingBet.externalId}`);
                return { ...incomingBet, fingerprint: existingBet.fingerprint };
            }
            return incomingBet;
        }));

        // 3. Preparar las nuevas entradas con su identidad canónica
        const entries = betsWithPreservedFields.map(bet => {
            const id = bet.externalId || (bet as any).offlineId;
            return {
                key: BetOfflineKeys.bet(id),
                data: bet
            };
        });
        await offlineStorage.setMulti(entries);
        // FASE 1 FIX: Invalidar cache después de modificar datos
        this.invalidateCache();
    }

    /**
     * Deduplica una colección de apuestas basada en su identidad semántica.
     */
    private dedup(bets: BetDomainModel[]): BetDomainModel[] {
        const map = new Map<string, BetDomainModel>();
        for (const bet of bets) {
            const key = buildBetDedupKey(bet);
            // La primera versión encontrada se mantiene (usualmente la del storage)
            if (!map.has(key)) {
                map.set(key, bet);
            }
        }
        return Array.from(map.values());
    }

    /**
     * Busca y elimina entradas obsoletas (UUID) que ya tienen una entrada canónica (ReceiptCode).
     */
    private async cleanupOrphanedEntries(newBets: BetDomainModel[]): Promise<void> {
        const receiptCodes = new Set(
            newBets.filter(b => b.receiptCode).map(b => b.receiptCode!)
        );

        if (receiptCodes.size === 0) return;

        const pattern = BetOfflineKeys.getPattern('pending', '*');
        const allEntries = await offlineStorage.query<BetDomainModel>(pattern).all();

        const toDelete: string[] = [];
        for (const bet of allEntries) {
            if (!bet) continue;

            // Si la apuesta en storage tiene un receiptCode que estamos guardando ahora
            const hasMatchingReceipt = bet.receiptCode && receiptCodes.has(bet.receiptCode);
            // Pero su externalId NO es el receiptCode (significa que es una entrada UUID vieja)
            const isUUIDKey = bet.externalId && !receiptCodes.has(bet.externalId);

            if (hasMatchingReceipt && isUUIDKey) {
                toDelete.push(bet.externalId!);
            }
        }

        if (toDelete.length > 0) {
            log.info(`[${BET_LOG_TAGS.OFFLINE_ADAPTER}] ${BET_LOGS.UPSERT_CLEANUP}: Eliminando ${toDelete.length} entradas temporales obsoletas`);
            for (const id of toDelete) {
                await offlineStorage.remove(BetOfflineKeys.bet(id));
            }
        }
    }

    /**
     * Obtiene todas las apuestas registradas aplicando deduplicación semántica (SSOT).
     * FASE 1 FIX: Implementa cache TTL y mutex para prevenir reentradas concurrentes.
     */
    async getAll(): Promise<BetDomainModel[]> {
        const now = Date.now();

        // 1. Verificar cache válido
        if (this._cache && (now - this._cache.timestamp) < BetOfflineAdapter.CACHE_TTL_MS) {
            this._dedupCounter++;
            log.info(`[${BET_LOG_TAGS.OFFLINE_ADAPTER}] Cache hit (${this._dedupCounter} deduplicaciones evitadas)`);
            return this._cache.data;
        }

        // 2. Mutex: Si hay una recuperación en curso, esperar a que termine
        if (this._ongoingRetrieval) {
            this._dedupCounter++;
            log.info(`[${BET_LOG_TAGS.OFFLINE_ADAPTER}] Esperando recuperación en curso (deduplicación #${this._dedupCounter})`);
            return this._ongoingRetrieval;
        }

        // 3. Crear promesa única y almacenar referencia para mutex
        this._ongoingRetrieval = this._doGetAll();

        try {
            const result = await this._ongoingRetrieval;
            return result;
        } finally {
            // Limpiar referencia del mutex
            this._ongoingRetrieval = null;
        }
    }

    /**
     * Implementación real de getAll() - solo se ejecuta una vez por ciclo
     */
    private async _doGetAll(): Promise<BetDomainModel[]> {
        log.info(`[${BET_LOG_TAGS.OFFLINE_ADAPTER}] ${BET_LOGS.RECOVERING_ALL}`);
        const pattern = BetOfflineKeys.getPattern(BET_KEYS.STORAGE_STATUS_PENDING, '*');
        log.info(`[FINGERPRINT_DEBUG] Query pattern: ${pattern}`);
        const results = await offlineStorage.query<BetDomainModel>(pattern).all();

        log.info(`[FINGERPRINT_DEBUG] Raw results from storage:`, {
            count: results.length,
            sample: results[0] ? {
                id: results[0].externalId,
                hasFingerprint: !!(results[0] as any).fingerprint,
                fingerprintKeys: (results[0] as any).fingerprint ? Object.keys((results[0] as any).fingerprint) : [],
                allKeys: Object.keys(results[0])
            } : 'no results'
        });

        const validBets = results.filter((b): b is BetDomainModel => b !== null);
        const uniqueBets = this.dedup(validBets);

        // Actualizar cache
        this._cache = {
            data: uniqueBets,
            timestamp: Date.now()
        };

        log.info(`[FINGERPRINT_DEBUG] After dedup and cache:`, {
            uniqueCount: uniqueBets.length,
            sampleHasFingerprint: uniqueBets[0] ? !!(uniqueBets[0] as any).fingerprint : false
        });

        log.info(`[${BET_LOG_TAGS.OFFLINE_ADAPTER}] ${BET_LOGS.DEDUP_STATS}: ${validBets.length} → ${uniqueBets.length} (cache actualizado)`);
        return uniqueBets;
    }

    /**
     * Invalida el cache de getAll() - llamar después de save/saveBatch/delete/updateStatus
     */
    private invalidateCache(): void {
        if (this._cache) {
            log.info(`[${BET_LOG_TAGS.OFFLINE_ADAPTER}] Cache invalidado`);
            this._cache = null;
        }
    }

    /**
     * Obtiene apuestas filtradas por diversos criterios (SSOT)
     */
    async getFiltered(filters: {
        todayStart?: number;
        structureId?: string;
        drawId?: string | number;
        receiptCode?: string;
        date?: number | string;
    }): Promise<BetDomainModel[]> {
        const all = await this.getAll();

        // 1. Determinar rango de fecha SOLO si se proporcionan filtros de tiempo
        let rangeStart: number | undefined;
        let rangeEnd: number | undefined;

        if (filters.todayStart) {
            rangeStart = filters.todayStart;
            rangeEnd = rangeStart + (24 * 60 * 60 * 1000);
        } else if (filters.date) {
            rangeStart = typeof filters.date === 'number' ? filters.date : new Date(filters.date).getTime();
            if (!isNaN(rangeStart)) {
                rangeEnd = rangeStart + (24 * 60 * 60 * 1000);
            } else {
                rangeStart = undefined; // Fecha inválida
            }
        }

        return all.filter((bet) => {
            // 1. Filtro de fecha (opcional)
            if (rangeStart !== undefined && rangeEnd !== undefined) {
                const timestamp = Number(bet.timestamp) || 0;
                if (timestamp < rangeStart || timestamp >= rangeEnd) return false;
            }

            // 2. Filtro de estructura (opcional)
            if (filters.structureId && bet.ownerStructure && String(bet.ownerStructure) !== String(filters.structureId)) {
                return false;
            }

            // 3. Filtro de Sorteo (opcional)
            if (filters.drawId && String(bet.drawId) !== String(filters.drawId)) {
                return false;
            }

            // 4. Filtro de Código de Recibo (opcional)
            if (filters.receiptCode && bet.receiptCode !== filters.receiptCode) {
                return false;
            }

            return true;
        });
    }

    /**
     * Zero Trust Running Balance: Obtiene el total de ventas acumulado para un sorteo
     */
    async getTotalSales(drawId: string | number): Promise<number> {
        const key = BetOfflineKeys.totalSales(drawId);
        const stored = await offlineStorage.get<number>(key);
        return stored || 0;
    }

    /**
     * Zero Trust Running Balance: Incrementa el total de ventas acumulado
     */
    async incrementTotalSales(drawId: string | number, amount: number): Promise<number> {
        const key = BetOfflineKeys.totalSales(drawId);
        const current = await this.getTotalSales(drawId);
        const next = current + amount;
        await offlineStorage.set(key, next);
        log.info(`[${BET_LOG_TAGS.OFFLINE_ADAPTER}] Running Balance actualizado para sorteo ${drawId}: ${current} -> ${next}`);
        return next;
    }

    /**
     * Obtiene las apuestas pendientes de sincronizar.
     * FASE 4: Asegura orden FIFO (First-In-First-Out) basado en timestamp
     * para mantener la integridad del Hash Chain en el backend.
     */
    async getPending(): Promise<BetDomainModel[]> {
        log.info(`[${BET_LOG_TAGS.OFFLINE_ADAPTER}] 1. ${BET_LOGS.PENDING_RECOVERY}`);
        const all = await this.getAll();
        const pending = all
            .filter(b => b.status === 'pending' || b.status === 'error' || b.status === 'blocked')
            // Ordenar por timestamp ascendente (FIFO)
            .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        log.info(`[${BET_LOG_TAGS.OFFLINE_ADAPTER}] 2. ${BET_LOGS.PENDING_FOUND}`);
        return pending;
    }

    /**
     * Obtiene apuestas por estado.
     * Mantiene el orden FIFO para consistencia.
     */
    async getByStatus(status: BetDomainModel['status']): Promise<BetDomainModel[]> {
        log.info(`[${BET_LOG_TAGS.OFFLINE_ADAPTER}] ${BET_LOGS.STATUS_RECOVERY}: ${status}`);
        const all = await this.getAll();
        return all
            .filter(b => b.status === status)
            .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    }

    /**
     * Obtiene apuestas recientes (pendientes o sincronizadas) para un sorteo específico.
     * Útil para cubrir la ventana de latencia del backend tras una sincronización exitosa.
     */
    async getRecentByDraw(drawId: string | number, maxAgeMs: number = BET_VALUES.RECENT_MAX_AGE_MS): Promise<BetDomainModel[]> {
        const all = await this.getAll();
        const normalizedDrawId = String(drawId);
        const now = Date.now();

        return all.filter(b => {
            const matchesDraw = String(b.drawId) === normalizedDrawId;
            const isPending = b.status === 'pending' || b.status === 'error';
            const isRecentSynced = b.status === 'synced' && (now - (b.timestamp || 0)) < maxAgeMs;

            return matchesDraw && (isPending || isRecentSynced);
        });
    }

    /**
     * Actualiza el estado de una apuesta
     */
    async updateStatus(offlineId: string, status: BetDomainModel['status'], extra?: Partial<BetDomainModel>): Promise<void> {
        const key = BetOfflineKeys.bet(offlineId);
        const bet = await offlineStorage.get<BetDomainModel>(key);

        if (bet) {
            log.info(`[${BET_LOG_TAGS.OFFLINE_ADAPTER}] ${BET_LOGS.UPDATE_STATUS} ${offlineId}: ${bet.status} -> ${status}`);
            const updatedBet = { ...bet, status, ...extra };
            await this.save(updatedBet);
        } else {
            log.warn(`[${BET_LOG_TAGS.OFFLINE_ADAPTER}] ${BET_LOGS.UPDATE_NOT_FOUND}: ${offlineId}`);
        }
    }

    /**
     * Elimina una apuesta del almacenamiento
     */
    async delete(offlineId: string): Promise<void> {
        log.info(`[BET-OFFLINE] Eliminando apuesta del almacenamiento: ${offlineId}`);
        const key = BetOfflineKeys.bet(offlineId);
        await offlineStorage.remove(key);
        // FASE 1 FIX: Invalidar cache después de modificar datos
        this.invalidateCache();
    }

    /**
     * Obtiene apuestas por sorteo
     */
    async getByDraw(drawId: string | number): Promise<BetDomainModel[]> {
        const all = await this.getAll();
        const normalizedDrawId = String(drawId);
        return all.filter(b => {
            if (!b) return false;
            return String(b.drawId) === normalizedDrawId;
        });
    }
}
