import AsyncStorage from '@react-native-async-storage/async-storage';
import { scenario, createTestContext, TestContext } from '@/tests/core';
import { ScenarioConfig } from '@/tests/core/scenario';
import { betRepository } from '@/shared/repositories/bet';
import { BetApi } from '@/shared/services/bet/api';
import { drawRepository } from '@/shared/repositories/draw';
import { isServerReachable } from '@/shared/utils/network';

jest.mock('expo-crypto', () => ({
    randomUUID: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substring(7))
}));

jest.mock('@/shared/utils/network', () => ({
    isServerReachable: jest.fn().mockResolvedValue(false)
}));

jest.mock('@/shared/services/bet/api', () => ({
    BetApi: {
        create: jest.fn(),
        createWithIdempotencyKey: jest.fn(),
        getSyncStatus: jest.fn(),
        list: jest.fn(),
        listByDrawId: jest.fn(),
        delete: jest.fn(),
        reportToDlq: jest.fn().mockResolvedValue({ status: 'reported' })
    }
}));

interface DlqTestData {
    syncResult?: { success: number; failed: number };
    blockedCount: number;
    lastBlockedError?: string;
    blockedOfflineId: string;
}

const testConfig: ScenarioConfig = {
    timeout: 60000
};

const makeContext = (): TestContext & { data: DlqTestData } => {
    const base = createTestContext({
        initialData: {
            blockedCount: 0,
            blockedOfflineId: ''
        }
    });

    return {
        ...base,
        data: base.data as DlqTestData
    };
};

beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    (isServerReachable as jest.Mock).mockResolvedValue(false);
});

scenario('DLQ local - errores fatales pasan a blocked y se excluyen de reintentos automáticos', makeContext(), testConfig)
    .given('una apuesta se guarda offline para sincronización posterior', async () => {
        (isServerReachable as jest.Mock).mockResolvedValue(false);

        await betRepository.placeBet({
            drawId: '307',
            numbers: '42',
            amount: 50,
            type: 'Fijo',
            betTypeId: '1',
            ownerStructure: '1'
        } as any);

        const pending = await betRepository.getPendingBets();
        expect(pending.length).toBeGreaterThan(0);
    })
    .when('el backend responde 404 draw inexistente durante sync', async (ctx: any) => {
        (isServerReachable as jest.Mock).mockResolvedValue(true);
        (BetApi.createWithIdempotencyKey as jest.Mock).mockRejectedValue({
            status: 404,
            message: 'Draw with id 307 not found'
        });

        ctx.data.syncResult = await betRepository.syncPending();
    })
    .then('la apuesta queda blocked con error fatal y no vuelve a reintentarse automáticamente', async (ctx: any) => {
        expect(ctx.data.syncResult).toEqual({ success: 0, failed: 1 });

        const all = await betRepository.getAllRawBets();
        const blocked = all.filter(b => b.status === 'blocked');

        ctx.data.blockedCount = blocked.length;
        ctx.data.lastBlockedError = blocked[0]?.syncContext?.lastError;
        ctx.data.blockedOfflineId = String(blocked[0]?.externalId ?? 'undefined');

        expect(ctx.data.blockedCount).toBe(1);
        expect(blocked[0]?.syncContext?.errorType).toBe('FATAL');
        expect(ctx.data.lastBlockedError).toContain('Draw with id 307 not found');

        const pending = await betRepository.getPendingBets();
        expect(pending.length).toBe(0);

        await betRepository.syncPending();
        expect(BetApi.createWithIdempotencyKey).toHaveBeenCalledTimes(1);

        // Nueva verificación de integración E2E (Reporte al backend)
        expect(BetApi.reportToDlq).toHaveBeenCalledWith(expect.objectContaining({
            idempotency_key: ctx.data.blockedOfflineId,
            error: expect.stringContaining('Draw with id 307 not found')
        }));
    })
    .test();

scenario('DLQ local - conciliación manual de apuesta bloqueada tras cambio de betType', makeContext(), testConfig)
    .given('una apuesta queda bloqueada por betTypeId legacy inválido', async (ctx: any) => {
        (isServerReachable as jest.Mock).mockResolvedValue(false);

        await betRepository.placeBet({
            drawId: '395',
            numbers: '12',
            amount: 80,
            type: 'Fijo',
            betTypeId: '1',
            ownerStructure: '1'
        } as any);

        (isServerReachable as jest.Mock).mockResolvedValue(true);
        (BetApi.createWithIdempotencyKey as jest.Mock).mockRejectedValue({
            status: 400,
            message: 'Bet type 1 is not valid for draw 395'
        });

        await betRepository.syncPending();

        const blocked = (await betRepository.getAllRawBets()).find(b => b.status === 'blocked');
        expect(blocked).toBeDefined();
        ctx.data.blockedOfflineId = String(blocked?.externalId ?? 'undefined');
    })
    .when('se re-procesa manualmente la apuesta bloqueada y el backend acepta el payload', async (ctx: any) => {
        await betRepository.resetSyncStatus(ctx.data.blockedOfflineId);

        (BetApi.createWithIdempotencyKey as jest.Mock).mockResolvedValue({
            id: 99902,
            draw: '395',
            bet_type: '6',
            numbers_played: '12',
            amount: 80,
            created_at: new Date().toISOString(),
            is_winner: false,
            payout_amount: 0,
            owner_structure: '1',
            receipt_code: 'DLQ2',
            external_id: ctx.data.blockedOfflineId,
            bet_type_details: { id: '6', name: 'Fijo', code: 'FIJO' }
        });

        const drawTypesSpy = jest.spyOn(drawRepository, 'getBetTypes').mockResolvedValue({
            isOk: () => true,
            value: [],
            isErr: () => false
        } as any);

        ctx.data.syncResult = await betRepository.syncPending();
        drawTypesSpy.mockRestore();
    })
    .then('la apuesta se sincroniza y sale de la cola DLQ local', async (ctx: any) => {
        expect(ctx.data.syncResult).toEqual({ success: 1, failed: 0 });

        const all = await betRepository.getAllRawBets();
        const synced = all.find(b => b.status === 'synced');

        expect(synced?.status).toBe('synced');
        expect((BetApi.createWithIdempotencyKey as jest.Mock).mock.calls.length).toBe(2);
    })
    .test();
