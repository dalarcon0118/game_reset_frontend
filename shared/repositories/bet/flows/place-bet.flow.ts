import { Result, Task } from '@/shared/core';
import * as Crypto from 'expo-crypto';
import { BetDomainModel, BetRepositoryResult } from '../bet.types';
import { IBetStorage, IBetApi } from '../bet.types';
import { offlineEventBus, SyncAdapter, syncWorker } from '@core/offline-storage/instance';
import { GameType, BetType } from '@/types';
import { mapSinglePendingBetToFrontend } from '../bet.mapper.backend';
import { logger } from '@/shared/utils/logger';
import { RepositoriesModule } from '@/shared/repositories';
import type { FingerprintRepository } from '@/shared/repositories/crypto/fingerprint.repository';
import type { INotificationRepository } from '@/shared/repositories/notification/notification.ports';
import type { IAuthRepository } from '@/shared/repositories/auth/auth.ports';
import type { ITimeRepository } from '@/shared/repositories/system/time';
import { BET_LOG_TAGS, BET_LOGS } from '../bet.constants';
import { isServerReachable } from '@/shared/utils/network';

const log = logger.withTag(BET_LOG_TAGS.PLACE_FLOW);
const generateReceiptCode = (): string =>
    Math.random().toString(36).substring(2, 7).toUpperCase();

const isAppBlocked = (bets: BetDomainModel[]): boolean =>
    bets.some(b => b.status === 'blocked');

/**
 * 1. Validate business rules (Sync part).
 */
const validateBusinessRulesSync = (
    betData: Omit<BetDomainModel, 'externalId' | 'status' | 'timestamp'>,
    allBets: BetDomainModel[],
    clientNow: number
): Result<Error, Omit<BetDomainModel, 'externalId' | 'status' | 'timestamp'>> => {
    const timerRepo = RepositoriesModule.getSync<ITimeRepository>('TimerRepository');
    const integrity = timerRepo.validateIntegrity(clientNow);

    if (integrity.status !== 'ok') {
        return Result.error(new Error(BET_LOGS.TIME_FRAUD_DETECTED));
    }

    if (isAppBlocked(allBets)) return Result.error(new Error(BET_LOGS.APP_BLOCKED));

    if ((Number(betData.amount) || 0) <= 0) return Result.error(new Error(BET_LOGS.INVALID_AMOUNT));
    if (!betData.ownerStructure) return Result.error(new Error(BET_LOGS.REQUIRED_STRUCTURE));

    return Result.ok(betData);
};

/**
 * Async validation: Check if draw is still open for betting.
 */
const validateDrawOpen = (drawId: string | number, clientNow: number): Task<Error, void> => {
    return Task.fromPromise(async () => {
        const drawRepo = RepositoriesModule.getSync<any>('DrawRepository');
        const drawResult = await drawRepo.getDraw(drawId);
        if (drawResult.isOk() && drawResult.value && drawResult.value.bettingEndTime < clientNow) {
            throw new Error(BET_LOGS.DRAW_CLOSED);
        }
    });
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
    const notificationRepository = await RepositoriesModule.get<INotificationRepository>('NotificationRepository');
    const isOnline = await isServerReachable();

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

        // Encolar en la cola global de sincronización (SyncWorker)
        for (const bet of bets) {
            await SyncAdapter.addToQueue({
                type: 'bet',
                entityId: bet.externalId,
                priority: 1,
                data: bet,
                status: 'pending',
                attempts: 0
            });
            log.info(`[${BET_LOG_TAGS.SYNC_STRATEGY}] Enqueued in global sync queue: ${bet.externalId}`);
        }

        // Solo mostrar "guardada" si está offline; si está online la notificación de sync se encargará
        if (!isOnline) {
            for (const bet of bets) {
                const externalKey = `bet-saved:${bet.receiptCode}`;
                notificationRepository.addNotification({
                    title: BET_LOGS.NOTIF_SAVED_TITLE,
                    message: BET_LOGS.NOTIF_SAVED_MESSAGE(bet.receiptCode || '', String(bet.drawId), bet.amount),
                    type: 'warning',
                    metadata: {
                        receiptCode: bet.receiptCode,
                        drawId: bet.drawId,
                        amount: bet.amount,
                        externalId: bet.externalId
                    }
                }, externalKey)
                    .then(() => log.info(`[${BET_LOG_TAGS.NOTIFICATION}] ✅ Saved notification created for ${bet.receiptCode}`))
                    .catch(e => log.warn(`[${BET_LOG_TAGS.NOTIFICATION}] ❌ Failed to create saved notification for ${bet.receiptCode}`, e));
            }
        }

        syncWorker.triggerSync().catch(e => log.error('Worker trigger failed', e));
    } catch (e) {
        log.error('Side effects failure', e);
    }
};

/**
 * 4. UI Metadata Resolution
 */
const resolveFrontendBet = async (bet: BetDomainModel): Promise<BetRepositoryResult> => {
    const drawRepository = await RepositoriesModule.get<any>('DrawRepository');
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
    const timerRepo = RepositoriesModule.getSync<ITimeRepository>('TimerRepository');
    const clientNow = Date.now();
    const trustedNow = timerRepo.getTrustedNow(clientNow);
    const authRepo = RepositoriesModule.getSync<IAuthRepository>('AuthRepository');
    const fingerprintRepo = RepositoriesModule.getSync<typeof FingerprintRepository>('FingerprintRepository');

    return Task.fromPromise(() => storage.getAll())
        .andThen(allBets => {
            const data = {
                ...betData,
                receiptCode: betData.receiptCode || generateReceiptCode()
            };
            const syncResult = validateBusinessRulesSync(data, allBets, clientNow);
            if (syncResult.isErr()) return Task.fail(syncResult.error);
            return validateDrawOpen(data.drawId, clientNow).map(() => syncResult.value);
        })
        .map(data => prepareBet(data, trustedNow))
        .andThen(bet => {
            // FASE 3: Interceptar y firmar la apuesta antes de guardar
            log.info(`[PLACE_BET_FLOW] 🔐 Intentando generar fingerprint para apuesta ${bet.externalId}`);

            return Task.fromPromise(() => storage.incrementTotalSales(Number(bet.drawId || 0), Number(bet.amount)))
                .andThen(totalSales => {
                    // ✅ ✅ ✅ SOLUCION FINAL: Obtener usuario DIRECTAMENTE de la fuente de verdad
                    // Nunca mas confiar en el estado del modulo. Nunca mas condiciones de carrera.
                    return Task.fromPromise(async () => {
                        const currentUser = await authRepo.getUserIdentity();
                        if (!currentUser || !currentUser.id || Number(currentUser.id) <= 0) {
                            log.error(`[PLACE_BET_FLOW] ❌ FATAL: No hay sesion de usuario valida en el momento de crear la apuesta.`);
                            log.error(`[PLACE_BET_FLOW] ❌ bet.externalId = ${bet.externalId}`);
                            throw new Error(`SEGURIDAD: No hay sesion activa. Por favor recarga la pagina.`);
                        }
                        return { totalSales, userId: Number(currentUser.id) };
                    })
                        .andThen(({ totalSales, userId }) => {

                            return fingerprintRepo.signBet({
                                userId: userId,
                                structureId: Number(bet.ownerStructure || 0),
                                drawId: Number(bet.drawId || 0),
                                betTypeId: Number(bet.betTypeId || 0),
                                numbers: Array.isArray(bet.numbers) ? bet.numbers.map(String) : [String(bet.numbers)],
                                amount: Number(bet.amount),
                                totalSales: totalSales,
                                timestamp: bet.timestamp
                            })
                                .mapError((e: Error | any) => {
                                    log.error(`[PLACE_BET_FLOW] ❌ Error en firma de fingerprint: ${e}`);
                                    return new Error(`${BET_LOGS.SIGN_ERROR}: ${e}`);
                                })
                                .map((fingerprint: any): BetDomainModel => {
                                    log.info(`[PLACE_BET_FLOW] ✅ Fingerprint V2 generado exitosamente para ${bet.externalId}`);
                                    return { ...bet, fingerprint, ownerUser: String(userId) };
                                });
                        })
                });
        })
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
    const timerRepo = RepositoriesModule.getSync<ITimeRepository>('TimerRepository');
    const clientNow = Date.now();
    const trustedNow = timerRepo.getTrustedNow(clientNow);
    const commonReceiptCode = generateReceiptCode();
    const fingerprintRepo = RepositoriesModule.getSync<typeof FingerprintRepository>('FingerprintRepository');

    return Task.fromPromise(() => storage.getAll())
        .andThen(allBets => {
            const list = betsData.map(b => ({ ...b, receiptCode: b.receiptCode || commonReceiptCode }));

            return Task.fromPromise(async () => {
                const results: Omit<BetDomainModel, 'externalId' | 'status' | 'timestamp'>[] = [];
                for (const betData of list) {
                    const syncResult = validateBusinessRulesSync(betData, allBets, clientNow);
                    if (syncResult.isErr()) throw syncResult.error;
                    const drawValidation = await validateDrawOpen(betData.drawId, clientNow).fork();
                    if (drawValidation.isErr()) throw drawValidation.error;
                    results.push(syncResult.value);
                }
                return results;
            });
        })
        .map(validList => validList.map(d => prepareBet(d, trustedNow)))
        .andThen(preparedList => {
            // FASE 3: Firmar secuencialmente todas las apuestas del lote con Running Balance

            return Task.fromPromise(() => storage.getTotalSales(Number(preparedList[0]?.drawId || 0)))
                .andThen(initialTotal => {
                    let runningTotal = initialTotal;

                    const signBetSequential = (bet: BetDomainModel): Task<Error, BetDomainModel> => {
                        runningTotal += Number(bet.amount);
                        const currentTotalForThisBet = runningTotal;

                        // ✅ ✅ ✅ SOLUCION FINAL: Obtener usuario DIRECTAMENTE de la fuente de verdad
                        // Nunca mas confiar en el estado del modulo. Nunca mas condiciones de carrera.
                        return Task.fromPromise(async () => {
                            const authRepo = RepositoriesModule.getSync<IAuthRepository>('AuthRepository');
                            const currentUser = await authRepo.getUserIdentity();
                            if (!currentUser || !currentUser.id || Number(currentUser.id) <= 0) {
                                log.error(`[PLACE_BATCH_FLOW] ❌ FATAL: No hay sesion de usuario valida en el momento de crear la apuesta.`);
                                log.error(`[PLACE_BATCH_FLOW] ❌ bet.externalId = ${bet.externalId}`);
                                throw new Error(`SEGURIDAD: No hay sesion activa. Por favor recarga la pagina.`);
                            }
                            return { currentTotalForThisBet, userId: Number(currentUser.id) };
                        })
                            .andThen(({ currentTotalForThisBet, userId }) => {

                                return fingerprintRepo.signBet({
                                    userId: userId,
                                    structureId: Number(bet.ownerStructure || 0),
                                    drawId: Number(bet.drawId || 0),
                                    betTypeId: Number(bet.betTypeId || 0),
                                    numbers: Array.isArray(bet.numbers) ? bet.numbers.map(String) : [String(bet.numbers)],
                                    amount: Number(bet.amount),
                                    totalSales: currentTotalForThisBet,
                                    timestamp: bet.timestamp
                                })
                                    .mapError((e: Error | any) => new Error(`${BET_LOGS.SIGN_ERROR}: ${e}`))
                                    .map((fingerprint: any): BetDomainModel => ({ ...bet, fingerprint, ownerUser: String(userId) }));
                            })
                    };

                    // Reduce para ejecutar secuencialmente y acumular el total
                    return preparedList.reduce(
                        (chain: Task<Error, BetDomainModel[]>, bet) =>
                            chain.andThen((list: BetDomainModel[]) =>
                                signBetSequential(bet).map(signed => [...list, signed])
                            ),
                        Task.succeed<BetDomainModel[], Error>([])
                    ).andThen(signedList => {
                        // Al final, persistir el total acumulado en el storage
                        return Task.fromPromise(() => storage.incrementTotalSales(Number(preparedList[0]?.drawId || 0), runningTotal - initialTotal))
                            .map(() => signedList);
                    });
                });
        })
        .andThen(prepared => Task.fromPromise(() => storage.saveBatch(prepared).then(() => prepared)))
        .tap(savedList => dispatchSideEffects(savedList, trustedNow))
        .andThen(savedList => Task.fromPromise(async () => {
            const drawRepo = await RepositoriesModule.get<any>('DrawRepository');
            const drawId = savedList[0]?.drawId;
            const betTypesResult = await drawRepo.getBetTypes(String(drawId || ''));
            const betTypes: GameType[] = betTypesResult.isOk()
                ? (betTypesResult.value as any[]).map((t: any): GameType => ({
                    id: String(t.id),
                    name: t.name,
                    code: t.code || '',
                    description: t.description || ''
                }))
                : [];

            return Promise.all(savedList.map(b => mapSinglePendingBetToFrontend(b as any, betTypes)));
        }));
};
