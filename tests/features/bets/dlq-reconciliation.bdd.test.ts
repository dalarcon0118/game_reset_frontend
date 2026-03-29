import AsyncStorage from '@react-native-async-storage/async-storage';
import { scenario, createTestContext, TestContext } from '@/tests/core';
import { ScenarioConfig } from '@/tests/core/scenario';
import { betRepository } from '@/shared/repositories/bet';
import { dlqRepository } from '@/shared/repositories/dlq';
import { offlineEventBus } from '@/shared/core/offline-storage/instance';
import { SyncAdapter } from '@/shared/core/offline-storage/sync/adapter';
import apiClient from '@/shared/services/api_client';

jest.mock('@react-native-community/netinfo', () => ({
    fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true }),
    addEventListener: jest.fn(),
    useNetInfo: jest.fn().mockReturnValue({ isConnected: true, isInternetReachable: true }),
}));

jest.mock('expo-crypto', () => ({
    randomUUID: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substring(7))
}));

jest.mock('@/shared/services/api_client', () => ({
    post: jest.fn().mockResolvedValue({ success: true }),
    get: jest.fn().mockResolvedValue({}),
    put: jest.fn().mockResolvedValue({})
}));

interface DlqTestData {
    blockedOfflineId: string;
    dlqId?: string;
}

const testConfig: ScenarioConfig = {
    timeout: 60000
};

const makeContext = (): any => {
    const base = createTestContext({
        initialData: {
            blockedOfflineId: '',
            originalBet: null,
            dlqId: ''
        }
    });

    return base;
};

beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    jest.restoreAllMocks(); // Asegura que no queden espías de otros tests

    // Re-inicializamos las suscripciones de los repositorios singletons
    // ya que el clearSubscribers() de los tests previos las habría borrado.
    (betRepository as any).setupEventBus?.();
    (dlqRepository as any).setupEventBus?.();
});

afterEach(async () => {
    jest.restoreAllMocks();
});

// Helper para esperar condiciones sin timeouts fijos (Opción A)
const waitFor = async (predicate: () => Promise<boolean>, timeout = 10000): Promise<void> => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        if (await predicate()) return;
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error('Timeout waiting for condition');
};

scenario('DLQ Full Cycle - Conciliación automática y auto-sync al backend', makeContext(), testConfig)
    .given('una apuesta queda bloqueada en el sistema local con datos específicos', async (ctx: any) => {
        console.log('[TEST-LOG] 1. Iniciando placeBet...');
        const betData = {
            drawId: '307',
            numbers: '42',
            amount: 50.55,
            type: 'Fijo',
            betTypeId: '1',
            ownerStructure: '1'
        };
        ctx.data.originalBet = betData;

        await betRepository.placeBet(betData as any);

        let pending = await betRepository.getPendingBets();
        console.log(`[TEST-LOG] 2. Apuestas pendientes encontradas: ${pending.length}`);

        if (pending.length === 0) {
            console.log('[TEST-LOG] 2.1. No pending bets found (likely auto-synced). Injecting manual pending bet for DLQ test...');
            const manualId = 'manual-test-id-' + Math.random().toString(36).substring(7);
            await (betRepository as any).addPendingBet({
                ...betData,
                externalId: manualId,
                status: 'pending',
                timestamp: Date.now(),
                syncContext: { attemptsCount: 0 }
            } as any);
            pending = await betRepository.getPendingBets();
        }

        const betId = pending[0].externalId;
        ctx.data.blockedOfflineId = betId;
        console.log(`[TEST-LOG] 3. Bloqueando apuesta: ${betId}`);

        const betStorage = (betRepository as any).storage;
        await betStorage.updateStatus(betId, 'blocked', {
            syncContext: { status: 'blocked', attemptsCount: 5, lastError: 'Fatal connection error' }
        });
    })
    .when('el sistema emite un evento de MAINTENANCE_COMPLETED y la apuesta se mueve a DLQ', async (ctx: any) => {
        console.log('[TEST-LOG] 4. Publicando evento MAINTENANCE_COMPLETED...');
        offlineEventBus.publish({
            type: 'MAINTENANCE_COMPLETED',
            entity: 'system',
            timestamp: Date.now(),
            payload: { status: 'ready' }
        });

        console.log('[TEST-LOG] 5. Esperando a que el item aparezca en DLQ...');
        await waitFor(async () => {
            const items = await dlqRepository.getAll();
            if (items.length > 0) {
                console.log(`[TEST-LOG] 6. Item encontrado en DLQ: ${items[0].id}`);
                ctx.data.dlqId = items[0].id;
                return true;
            }
            return false;
        });

        console.log(`[TEST-LOG] 6.1. Validando traspaso para ${ctx.data.blockedOfflineId}`);
        const allBets = await (betRepository as any).storage.getAll();
        const bet = allBets.find((b: any) => b.externalId === ctx.data.blockedOfflineId);
        expect(bet.status).toBe('synced');

        const queue = await SyncAdapter.getQueue();
        const syncItem = queue.find(q => q.type === 'dlq' && q.entityId === ctx.data.dlqId);
        expect(syncItem).toBeDefined();
    })
    .when('el SyncWorker procesa el item del DLQ exitosamente', async (ctx: any) => {
        if (!ctx.data.dlqId) {
            throw new Error('No dlqId found in context! Step sequence might be wrong.');
        }
        console.log(`[TEST-LOG] 7. Simulando éxito de sync para DLQ Item: ${ctx.data.dlqId}`);
        (apiClient.post as jest.Mock).mockResolvedValue({ success: true });

        offlineEventBus.publish({
            type: 'SYNC_ITEM_SUCCESS',
            entity: 'dlq',
            timestamp: Date.now(),
            payload: { entityId: ctx.data.dlqId }
        });

        console.log('[TEST-LOG] 8. Esperando estado "reconciled"...');
        await waitFor(async () => {
            const item = await dlqRepository.getById(ctx.data.dlqId!);
            if (item?.status === 'reconciled') console.log('[TEST-LOG] 9. Item marcado como "reconciled"!');
            return item?.status === 'reconciled';
        });
    })
    .then('el item del DLQ queda marcado como reconciliado y se notifica al backend', async (ctx: any) => {
        const dlqItem = await dlqRepository.getById(ctx.data.dlqId!);
        expect(dlqItem?.status).toBe('reconciled');

        // Verificamos que se haya notificado al backend.
        // Usamos expect.stringContaining sin el prefijo /api/v1/ ya que depende de la configuración
        expect(apiClient.post).toHaveBeenCalledWith(
            expect.stringContaining(`/dlq/${ctx.data.dlqId}/reconcile`),
            expect.objectContaining({ resolution: 'reconcile' })
        );
    })
    .test();

scenario('DLQ - Fallo en cascada y recuperación del SSOT (Opción C)', makeContext(), testConfig)
    .given('una apuesta bloqueada y un fallo inyectado en el repositorio DLQ', async (ctx: any) => {
        const betData = { drawId: '1', numbers: '10', amount: 10, ownerStructure: '1' };
        await betRepository.placeBet(betData as any);

        const pending = await betRepository.getPendingBets();
        if (pending.length === 0) {
            // Fallback: Si placeBet falló por alguna razón, inyectamos directamente
            await (betRepository as any).addPendingBet({
                ...betData,
                externalId: 'manual-id-' + Date.now(),
                status: 'pending',
                timestamp: Date.now()
            } as any);
        }

        const updatedPending = await betRepository.getPendingBets();
        ctx.data.blockedOfflineId = updatedPending[0].externalId;

        await (betRepository as any).storage.updateStatus(ctx.data.blockedOfflineId, 'blocked', {
            syncContext: { status: 'blocked', attemptsCount: 3 }
        });

        // Inyectamos un error en el DLQ Repository para simular fallo de escritura
        jest.spyOn(dlqRepository, 'add').mockImplementationOnce(async () => {
            throw new Error('DLQ Storage Full');
        });
    })
    .when('se intenta la reconciliación automática', async () => {
        offlineEventBus.publish({
            type: 'MAINTENANCE_COMPLETED',
            entity: 'system',
            timestamp: Date.now(),
            payload: { status: 'ready' }
        });

        // Damos un tiempo pequeño para que falle
        await new Promise(resolve => setTimeout(resolve, 50));
    })
    .then('la apuesta original MANTIENE su estado de error y no se marca como sincronizada', async (ctx: any) => {
        const allBets = await (betRepository as any).storage.getAll();
        const bet = allBets.find((b: any) => b.externalId === ctx.data.blockedOfflineId);

        // SSOT Integrity: Si el DLQ falló, la apuesta DEBE seguir marcada como pendiente/error
        // No puede pasar a 'synced' porque se perdería el dato (no está en DLQ ni en el backend)
        expect(bet.status).toBe('blocked');

        const dlqItems = await dlqRepository.getAll();
        expect(dlqItems.length).toBe(0);

        jest.restoreAllMocks();
    })
    .test();

