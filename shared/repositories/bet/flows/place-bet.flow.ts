import { Result, Task } from '@/shared/core';
import * as Crypto from 'expo-crypto';
import { BetDomainModel, BetRepositoryResult } from '../bet.types';
import { IBetStorage, IBetApi } from '../bet.types';
import { offlineEventBus, syncWorker } from '@core/offline-storage/instance';
import { drawRepository } from '../../draw';
import { GameType, BetType } from '@/types';
import { mapSinglePendingBetToFrontend } from '../bet.mapper.backend';
import { logger } from '@/shared/utils/logger';
import { TimerRepository } from '@/shared/repositories/system/time';
import { notificationRepository } from '@/shared/repositories/notification';

const log = logger.withTag('PlaceBetFlow');

const generateReceiptCode = (): string =>
    Math.random().toString(36).substring(2, 7).toUpperCase();

const isAppBlocked = (bets: BetDomainModel[]): boolean =>
    bets.some(b => b.status === 'blocked');

/**
 * 1. Validate business rules.
 */
const validateBusinessRules = (
    betData: Omit<BetDomainModel, 'externalId' | 'status' | 'timestamp'>,
    allBets: BetDomainModel[],
    clientNow: number
): Result<Error, Omit<BetDomainModel, 'externalId' | 'status' | 'timestamp'>> => {
    const integrity = TimerRepository.validateIntegrity(clientNow);
    if (integrity.status !== 'ok') {
        return Result.error(new Error('FRAUDE_TIEMPO: Anomalía detectada en el reloj.'));
    }

    if (isAppBlocked(allBets)) return Result.error(new Error('APUESTA_BLOQUEADA: Sincronización requerida.'));

    if ((Number(betData.amount) || 0) <= 0) return Result.error(new Error('ERROR_CRITICO: Monto inválido.'));
    if (!betData.ownerStructure) return Result.error(new Error('ERROR_CRITICO: Estructura obligatoria.'));

    return Result.ok(betData);
};

/**
 * 2. Prepare and save bet locally.
 */
const prepareBet = (
    betData: Omit<BetDomainModel, 'externalId' | 'status' | 'timestamp'>,
    trustedNow: number
): BetDomainModel => ({
    ...betData,
    externalId: Crypto.randomUUID(),
    status: 'pending',
    timestamp: trustedNow
});

/**
 * 3. Side-Effects: Notification and Background Sync
 */
const dispatchSideEffects = async (bets: BetDomainModel[], trustedNow: number): Promise<void> => {
    try {
        // Publicar eventos de cambio local
        bets.forEach(bet => {
            offlineEventBus.publish({
                type: 'ENTITY_CHANGED',
                entity: `bet:${bet.externalId}`,
                payload: { entityId: bet.externalId, drawId: bet.drawId, changeType: 'local_added' },
                timestamp: trustedNow
            });
        });

        // Notificar al usuario que la apuesta está pendiente de sincronización
        // Usamos fire-and-forget para no bloquear el flujo y evitar timeouts
        const now = new Date().toISOString();
        bets.forEach(bet => {
            log.info(`[BET-NOTIFICATION] Creando notificación pendiente para apuesta ${bet.receiptCode}`);
            // Fire-and-forget: no esperamos la respuesta para evitar timeouts
            notificationRepository.addNotification({
                title: 'Apuesta Guardada',
                message: `Apuesta ${bet.receiptCode} guardada localmente (Pendiente de conexión)`,
                type: 'warning',
                updatedAt: now,
                metadata: {
                    receiptCode: bet.receiptCode,
                    drawId: bet.drawId,
                    externalId: bet.externalId
                }
            })
            .then(() => log.info(`[BET-NOTIFICATION] ✅ Notificación pendiente creada exitosamente para ${bet.receiptCode}`))
            .catch(e => log.warn(`[BET-NOTIFICATION] ❌ Failed to create pending notification for ${bet.receiptCode}`, e));
        });

        syncWorker.triggerSync().catch(e => log.error('Worker trigger failed', e));
    } catch (e) {
        log.error('Side effects failure', e);
    }
};

/**
 * 4. UI Metadata Resolution
 */
const resolveFrontendBet = async (bet: BetDomainModel): Promise<BetRepositoryResult> => {
    const betTypesResult = await drawRepository.getBetTypes(String(bet.drawId || ''));
    const betTypes: GameType[] = betTypesResult.isOk()
        ? (betTypesResult.value as any[]).map((t: any): GameType => ({
            id: String(t.id),
            name: t.name,
            code: t.code || '',
            description: t.description || ''
        }))
        : [];
    return mapSinglePendingBetToFrontend(bet as any, betTypes);
};

/**
 * MAIN FLOW: Place Single Bet
 */
export const placeBetFlow = (
    betData: Omit<BetDomainModel, 'externalId' | 'status' | 'timestamp'>,
    storage: IBetStorage,
    _api: IBetApi
): Task<Error, BetRepositoryResult> => {
    const clientNow = Date.now();
    const trustedNow = TimerRepository.getTrustedNow(clientNow);

    return Task.fromPromise(() => storage.getAll())
        .andThen(allBets => {
            const data = {
                ...betData,
                receiptCode: betData.receiptCode || generateReceiptCode()
            };
            const res = validateBusinessRules(data, allBets, clientNow);
            if (res.isErr()) return Task.fail(res.error);
            return Task.succeed(res.value);
        })
        .map(data => prepareBet(data, trustedNow))
        .andThen(bet => Task.fromPromise(() => storage.save(bet).then(() => bet)))
        .tap(savedBet => dispatchSideEffects([savedBet], trustedNow))
        .andThen(savedBet => Task.fromPromise(() => resolveFrontendBet(savedBet)));
};

/**
 * MAIN FLOW: Place Batch of Bets
 */
export const placeBatchFlow = (
    betsData: Omit<BetDomainModel, 'externalId' | 'status' | 'timestamp'>[],
    storage: IBetStorage,
    _api: IBetApi
): Task<Error, BetType[]> => {
    const clientNow = Date.now();
    const trustedNow = TimerRepository.getTrustedNow(clientNow);
    const commonReceiptCode = generateReceiptCode();

    return Task.fromPromise(() => storage.getAll())
        .andThen(allBets => {
            const list = betsData.map(b => ({ ...b, receiptCode: b.receiptCode || commonReceiptCode }));
            const res = Result.combine(list.map(d => validateBusinessRules(d, allBets, clientNow)));
            if (res.isErr()) return Task.fail(res.error);
            return Task.succeed(res.value);
        })
        .map(validList => validList.map(d => prepareBet(d, trustedNow)))
        .andThen(prepared => Task.fromPromise(() => storage.saveBatch(prepared).then(() => prepared)))
        .tap(savedList => dispatchSideEffects(savedList, trustedNow))
        .andThen(savedList => Task.fromPromise(async () => {
            const drawId = savedList[0]?.drawId;
            const betTypesResult = await drawRepository.getBetTypes(String(drawId || ''));
            const betTypes: GameType[] = betTypesResult.isOk()
                ? (betTypesResult.value as any[]).map((t: any) => ({
                    id: String(t.id), name: t.name, code: t.code || '', description: t.description || ''
                }))
                : [];
            return savedList.map(b => mapSinglePendingBetToFrontend(b as any, betTypes)) as BetType[];
        }));
};
