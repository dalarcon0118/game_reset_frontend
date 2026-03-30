import { scenario, createTestContext } from '@/tests/core';
import { telemetryRepository } from '@/shared/repositories/system/telemetry';
import { syncWorker } from '@core/offline-storage/instance';
import apiClient from '@/shared/services/api_client';
import { logger } from '@/shared/utils/logger';

jest.mock('@react-native-community/netinfo', () => ({
    fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true }),
    addEventListener: jest.fn(),
    useNetInfo: jest.fn().mockReturnValue({ isConnected: true, isInternetReachable: true }),
}));

jest.mock('@/shared/services/api_client', () => ({
    post: jest.fn().mockResolvedValue({ success: true }),
    get: jest.fn().mockResolvedValue({}),
    put: jest.fn().mockResolvedValue({})
}));

beforeEach(async () => {
    jest.clearAllMocks();
    await telemetryRepository.initialize();
});

scenario('Telemetría - Captura de errores críticos y sincronización diferida', createTestContext())
    .given('un entorno offline y el sistema de telemetría inicializado', async (ctx: any) => {
        ctx.data.isNetworkOnline = false;
        await telemetryRepository.initialize();
    })
    .when('ocurre una excepción en el motor TEA durante un "update"', async (ctx: any) => {
        const teaError = new Error('Match error: Message LOGIN_FAILED not handled');
        const errorMetadata = {
            traceId: 'tea-trace-123',
            lastMsg: { type: 'LOGIN_FAILED', payload: { code: 500 } }
        };

        logger.error('❌ UPDATE FAILED', teaError, errorMetadata);

        ctx.data.expectedErrorId = 'tea-trace-123';
    })
    .then('el error técnico se persiste localmente con contexto de trazabilidad', async (ctx: any) => {
        const storedErrors = await telemetryRepository.getErrorsByType('TEA_UPDATE_FAILURE');
        expect(storedErrors).toContainEqual(expect.objectContaining({
            type: 'TEA_UPDATE_FAILURE',
            context: expect.objectContaining({ traceId: 'tea-trace-123' })
        }));
    })

    .when('se detecta una discrepancia mayor a 60s entre el reloj local y el servidor', async (ctx: any) => {
        await telemetryRepository.captureTimeSkew({
            localTimestamp: Date.now(),
            expectedTimestamp: Date.now() - 120000,
            source: 'DRAW_CLOSURE_VALIDATION'
        });
    })
    .then('se registra un evento de telemetría de alta prioridad para auditoría', async (ctx: any) => {
        const skewEvents = await telemetryRepository.getErrorsByType('TIME_SKEW');
        expect(skewEvents.length).toBeGreaterThan(0);
        expect(skewEvents[0].priority).toBe('HIGH');
    })

    .when('el dispositivo recupera la conexión a internet', async (ctx: any) => {
        ctx.data.isNetworkOnline = true;
        (apiClient.post as jest.Mock).mockResolvedValue({ success: true });
        await syncWorker.forceSync('telemetry');
    })
    .then('todos los errores acumulados se envían en un solo batch al servidor', async (ctx: any) => {
        expect(apiClient.post).toHaveBeenCalledWith(
            expect.stringContaining('/v1/system/telemetry/batch/'),
            expect.objectContaining({
                events: expect.arrayContaining([
                    expect.objectContaining({ type: 'TEA_UPDATE_FAILURE' }),
                    expect.objectContaining({ type: 'TIME_SKEW' })
                ])
            })
        );
    })
    .then('la cola de telemetría local se limpia para optimizar el almacenamiento', async (ctx: any) => {
        const remaining = await telemetryRepository.getPendingErrors();
        expect(remaining.length).toBe(0);
    })
    .test();
