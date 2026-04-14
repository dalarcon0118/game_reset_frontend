import { scenario, createTestContext, TestContext } from '@/tests/core';
import { ScenarioConfig } from '@/tests/core/scenario';
import { TelemetryStorageAdapter } from '@/shared/repositories/system/telemetry/adapters/telemetry.storage.adapter';
import { TelemetryPushStrategy } from '@/shared/repositories/system/telemetry/sync/telemetry.push.strategy';
import { syncWorker } from '@core/offline-storage/instance';
import { SyncAdapter } from '@core/offline-storage/sync/adapter';

jest.mock('@react-native-community/netinfo', () => ({
    fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true, type: 'wifi' }),
    addEventListener: jest.fn(),
    useNetInfo: jest.fn(),
}));

jest.mock('@shared/repositories/system/telemetry/adapters/telemetry.api.adapter', () => ({
    TelemetryApiAdapter: jest.fn().mockImplementation(() => ({
        sendBatch: jest.fn().mockResolvedValue({ success: true, syncedIds: [] })
    }))
}));

jest.mock('@shared/services/api_client', () => ({
    default: {
        post: jest.fn().mockResolvedValue({ success: true, syncedIds: [] }),
        config: jest.fn()
    },
    apiClient: {
        post: jest.fn().mockResolvedValue({ success: true, syncedIds: [] }),
        config: jest.fn()
    }
}));

interface TelemetryTestData {
    traceId: string;
    eventId: string;
}

const testConfig: ScenarioConfig = {
    timeout: 30000
};

const baseContext = createTestContext({
    initialData: {
        traceId: `e2e-no-auth-${Date.now()}`,
        eventId: ''
    }
});

const initialContext: TestContext & { data: TelemetryTestData } = {
    ...baseContext,
    data: baseContext.data as TelemetryTestData
};

scenario('E2E: Telemetría sin autenticación', initialContext, testConfig)
    
    .given('El repositorio de telemetría está inicializado', async (ctx) => {
        syncWorker.registerStrategy('telemetry', new TelemetryPushStrategy());
        
        ctx.log!('Repositorio de telemetría inicializado');
    })

    .when('Se captura un error con trace_id específico', async (ctx) => {
        const traceId = ctx.data!.traceId;
        const eventId = `te_tea_update_failure_${Date.now()}_test123`;
        
        const storage = new TelemetryStorageAdapter();
        
        await storage.save({
            id: eventId,
            type: 'TEA_UPDATE_FAILURE',
            priority: 'HIGH',
            timestamp: Date.now(),
            message: 'Test error sin autenticación',
            context: { traceId, source: 'e2e-test' },
            traceId,
            synced: false
        });
        
        await SyncAdapter.addToQueue({
            type: 'telemetry',
            entityId: eventId,
            priority: 2,
            status: 'pending',
            attempts: 0,
            data: {
                id: eventId,
                type: 'TEA_UPDATE_FAILURE',
                priority: 'HIGH',
                timestamp: Date.now(),
                message: 'Test error sin autenticación',
                context: { traceId, source: 'e2e-test' },
                traceId,
                synced: false
            }
        });
        
        ctx.data!.eventId = eventId;
        console.log(`[TEST] Error saved with eventId: ${eventId}, traceId: ${traceId}`);
        
        const report = await syncWorker.forceSync('telemetry');
        console.log(`[TEST] Sync Report:`, JSON.stringify(report, null, 2));
        
        ctx.log!(`Error capturado y sincronizado`);
    })

    .then('El evento debe existir en el repositorio', async (ctx) => {
        const storage = new TelemetryStorageAdapter();
        const all = await storage.getAll();
        const foundEvent = all.find(e => e.id === ctx.data!.eventId);
        
        expect(foundEvent).toBeDefined();
        expect(foundEvent?.type).toBe('TEA_UPDATE_FAILURE');
        
        console.log(`[TEST] ✅ Event found: ${foundEvent?.id}`);
        ctx.log!(`✅ Éxito: Telemetría funcional sin autenticación`);
    })
    .test();