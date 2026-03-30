import { Result, ok, err, ResultAsync, okAsync, errAsync } from 'neverthrow';
import * as Crypto from 'expo-crypto';
import { BetDomainModel, BetRepositoryResult } from '../bet.types';
import { IBetStorage, IBetApi } from '../bet.ports';
import { BetLogic } from '../bet.logic';
import { offlineEventBus, syncWorker } from '@core/offline-storage/instance';
import { drawRepository } from '../../draw';
import { GameType, BetType } from '@/types';
import { mapSinglePendingBetToFrontend } from '@/shared/services/bet/mapper';
import { logger } from '@/shared/utils/logger';
import { TimerRepository } from '@/shared/repositories/system/time';

const log = logger.withTag('PlaceBetFlow');

/**
 * 1. Validate business rules.
 */
const validateBusinessRules = (
    betData: Omit<BetDomainModel, 'externalId' | 'status' | 'timestamp'>,
    allBets: BetDomainModel[],
    clientNow: number
): Result<Omit<BetDomainModel, 'externalId' | 'status' | 'timestamp'>, Error> => {
    const integrity = TimerRepository.validateIntegrity(clientNow);
    if (integrity.status !== 'ok') {
        return err(new Error('FRAUDE_TIEMPO: Anomalía detectada en el reloj.'));
    }

    const { blocked } = BetLogic.isAppBlocked(allBets);
    if (blocked) return err(new Error('APUESTA_BLOQUEADA: Sincronización requerida.'));

    if ((Number(betData.amount) || 0) <= 0) return err(new Error('ERROR_CRITICO: Monto inválido.'));
    if (!betData.ownerStructure) return err(new Error('ERROR_CRITICO: Estructura obligatoria.'));

    return ok(betData);
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
const dispatchSideEffects = (bets: BetDomainModel[], trustedNow: number): void => {
    try {
        bets.forEach(bet => {
            offlineEventBus.publish({
                type: 'SYNC_ITEM_SUCCESS',
                entity: 'bet',
                payload: { id: bet.externalId, drawId: bet.drawId, changeType: 'local_added' },
                timestamp: trustedNow
            });
        });
        syncWorker.triggerSync().catch(e => log.error('Worker trigger failed', e));
    } catch (e) {
        log.error('Side effects failure', e);
    }
};

/**
 * 4. UI Metadata Resolution
 */
const resolveFrontendBet = async (bet: BetDomainModel): Promise<Result<BetRepositoryResult, Error>> => {
    const betTypesResult = await drawRepository.getBetTypes(String(bet.drawId || ''));
    const betTypes: GameType[] = betTypesResult.isOk()
        ? betTypesResult.value.map((t): GameType => ({
            id: String(t.id),
            name: t.name,
            code: t.code || '',
            description: t.description || ''
        }))
        : [];
    return ok(mapSinglePendingBetToFrontend(bet as any, betTypes));
};

/**
 * MAIN FLOW: Place Single Bet (Senior Refactor)
 */
export const placeBetFlow = async (
    betData: Omit<BetDomainModel, 'externalId' | 'status' | 'timestamp'>,
    storage: IBetStorage,
    _api: IBetApi
): Promise<Result<BetRepositoryResult, Error>> => {
    const clientNow = Date.now();
    const trustedNow = TimerRepository.getTrustedNow(clientNow);
    const allBets = await storage.getAll();

    return okAsync({
        ...betData,
        receiptCode: betData.receiptCode || BetLogic.generateReceiptCode()
    })
        .andThen(data => {
            const res = validateBusinessRules(data, allBets, clientNow);
            return res.isOk() ? okAsync(res.value) : errAsync(res.error);
        })
        .map(data => prepareBet(data, trustedNow))
        .andThen(bet => ResultAsync.fromPromise(storage.save(bet).then(() => bet), e => e as Error))
        .map(savedBet => {
            dispatchSideEffects([savedBet], trustedNow);
            return savedBet;
        })
        .andThen(savedBet => ResultAsync.fromPromise(resolveFrontendBet(savedBet), e => e as Error));
};

/**
 * MAIN FLOW: Place Batch of Bets (Senior Refactor)
 */
export const placeBatchFlow = async (
    betsData: Omit<BetDomainModel, 'externalId' | 'status' | 'timestamp'>[],
    storage: IBetStorage,
    _api: IBetApi
): Promise<Result<BetType[], Error>> => {
    const clientNow = Date.now();
    const trustedNow = TimerRepository.getTrustedNow(clientNow);
    const allBets = await storage.getAll();
    const commonReceiptCode = BetLogic.generateReceiptCode();

    return okAsync(betsData.map(b => ({ ...b, receiptCode: b.receiptCode || commonReceiptCode })))
        .andThen(list => {
            const res = Result.combine(list.map(d => validateBusinessRules(d, allBets, clientNow)));
            return res.isOk() ? okAsync(res.value) : errAsync(res.error);
        })
        .map(validList => validList.map(d => prepareBet(d, trustedNow)))
        .andThen(prepared => ResultAsync.fromPromise(storage.saveBatch(prepared).then(() => prepared), e => e as Error))
        .map(savedList => {
            dispatchSideEffects(savedList, trustedNow);
            return savedList;
        })
        .andThen(savedList => ResultAsync.fromPromise((async () => {
            const drawId = savedList[0]?.drawId;
            const betTypesResult = await drawRepository.getBetTypes(String(drawId || ''));
            const betTypes: GameType[] = betTypesResult.isOk() ? betTypesResult.value.map(t => ({
                id: String(t.id), name: t.name, code: t.code || '', description: t.description || ''
            })) : [];
            return ok(savedList.map(b => mapSinglePendingBetToFrontend(b as any, betTypes)) as BetType[]);
        })(), e => e as Error));
};
