import { IBetStorage, BetDomainModel } from '../bet.types';
import { offlineStorage } from '@core/offline-storage/instance';
import { OfflineStorageKeyManager } from '@core/offline-storage/utils';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('BetOfflineAdapter');

const BetOfflineKeys = {
    bet: (id: string) => OfflineStorageKeyManager.generateKey('bet', 'pending', id, 'data'),
    getPattern: (entity: string = 'pending', id: string = '*') => OfflineStorageKeyManager.getPattern('bet', entity, id, 'data'),
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
 */
export class BetOfflineAdapter implements IBetStorage {

    /**
     * Guarda o actualiza una apuesta en el almacenamiento offline
     */
    async save(bet: BetDomainModel): Promise<void> {
        const id = bet.externalId || (bet as any).offlineId;
        const key = BetOfflineKeys.bet(id);
        log.info(`[BET-OFFLINE] Guardando apuesta: ${id} (Estado: ${bet.status})`);
        // Sin TTL - las apuestas pendientes persisten hasta sincronización manual
        await offlineStorage.set(key, bet);
    }

    /**
     * Guarda un lote de apuestas en una sola operación con lógica de Upsert inteligente.
     * Identifica y elimina entradas temporales (UUID) que ya tienen un receiptCode canónico.
     */
    async saveBatch(bets: BetDomainModel[]): Promise<void> {
        log.info(`[BET-OFFLINE] Guardando lote de ${bets.length} apuestas (Upsert Mode).`);

        // 1. Limpiar entradas que van a ser reemplazadas por este lote (Upsert)
        await this.cleanupOrphanedEntries(bets);

        // 2. Preparar las nuevas entradas con su identidad canónica
        const entries = bets.map(bet => {
            const id = bet.externalId || (bet as any).offlineId;
            return {
                key: BetOfflineKeys.bet(id),
                data: bet
            };
        });
        await offlineStorage.setMulti(entries);
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
            log.info(`[BET-OFFLINE] Upsert: Eliminando ${toDelete.length} entradas temporales obsoletas`);
            for (const id of toDelete) {
                await offlineStorage.remove(BetOfflineKeys.bet(id));
            }
        }
    }

    /**
     * Obtiene todas las apuestas registradas aplicando deduplicación semántica (SSOT).
     */
    async getAll(): Promise<BetDomainModel[]> {
        log.info('[BET-OFFLINE] Recuperando todas las apuestas del almacenamiento...');
        const pattern = BetOfflineKeys.getPattern('pending', '*');
        const results = await offlineStorage.query<BetDomainModel>(pattern).all();

        const validBets = results.filter((b): b is BetDomainModel => b !== null);
        const uniqueBets = this.dedup(validBets);

        log.info(`[BET-OFFLINE] Deduplicación: ${validBets.length} → ${uniqueBets.length}`);
        return uniqueBets;
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
     * Obtiene las apuestas pendientes de sincronizar
     */
    async getPending(): Promise<BetDomainModel[]> {
        log.info('[BET-OFFLINE] 1. Recuperando apuestas pendientes (pending, error, blocked)...');
        const all = await this.getAll();
        const pending = all.filter(b => b.status === 'pending' || b.status === 'error' || b.status === 'blocked');
        log.info(`[BET-OFFLINE] 2. Encontradas ${pending.length} apuestas pendientes.`);
        return pending;
    }

    /**
     * Obtiene apuestas por estado
     */
    async getByStatus(status: BetDomainModel['status']): Promise<BetDomainModel[]> {
        log.info(`[BET-OFFLINE] Recuperando apuestas por estado: ${status}`);
        const all = await this.getAll();
        return all.filter(b => b.status === status);
    }

    /**
     * Obtiene apuestas recientes (pendientes o sincronizadas) para un sorteo específico.
     * Útil para cubrir la ventana de latencia del backend tras una sincronización exitosa.
     */
    async getRecentByDraw(drawId: string | number, maxAgeMs: number = 60 * 60 * 1000): Promise<BetDomainModel[]> {
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
            log.info(`[BET-OFFLINE] Actualizando estado de apuesta ${offlineId}: ${bet.status} -> ${status}`);
            const updatedBet = { ...bet, status, ...extra };
            await this.save(updatedBet);
        } else {
            log.warn(`[BET-OFFLINE] No se encontró apuesta para actualizar: ${offlineId}`);
        }
    }

    /**
     * Elimina una apuesta del almacenamiento
     */
    async delete(offlineId: string): Promise<void> {
        log.info(`[BET-OFFLINE] Eliminando apuesta del almacenamiento: ${offlineId}`);
        const key = BetOfflineKeys.bet(offlineId);
        await offlineStorage.remove(key);
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
