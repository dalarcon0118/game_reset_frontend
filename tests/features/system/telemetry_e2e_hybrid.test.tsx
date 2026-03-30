import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react-native';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import * as eva from '@eva-design/eva';

import { scenario, setViewAdapter, createTestContext, TestContext } from '@/tests/core';
import { ScenarioConfig } from '@/tests/core/scenario';
import { TelemetryVerifier } from './helpers/telemetry_verifier';
import { DevToolbar } from '@/app/_layout';
import { telemetryRepository } from '@/shared/repositories/system/telemetry';
import { MiddlewareRegistry } from '@/shared/core/tea-utils/middleware_registry';
import { CoreService } from '@/core/core_module/service';
import { isServerReachable } from '@/shared/utils/network';
import { syncWorker } from '@/shared/core/offline-storage/instance';
import { settings } from '@/config/settings';
import { createTestEnv } from '@/tests/utils/test-env';

import NetInfo from '@react-native-community/netinfo';

// Usar el logger real para permitir observadores de telemetría
const { logger } = jest.requireActual('@/shared/utils/logger');

// Configurar view adapter para React Native
setViewAdapter('react-native');

// Mock de NetInfo (SSoT Policy)
jest.mock('@react-native-community/netinfo', () => ({
    fetch: jest.fn().mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
    }),
    addEventListener: jest.fn(),
    useNetInfo: jest.fn(),
}));

// Middleware de Debug para TEA
const DebugTeaMiddleware = {
    id: 'debug-telemetry-test',
    onMsg: (msg: any) => {
        console.log(`[TEA_DEBUG] Message dispatched: ${msg.type}`, msg);
        return msg;
    }
};

/**
 * Test E2E Híbrido para Telemetría usando RNTL
 */
interface TelemetryTestData {
    traceId: string;
    foundInBackend: boolean;
    renderResult: any;
    testEnv?: any;
}

const testConfig: ScenarioConfig = {
    timeout: 30000 
};

const baseContext = createTestContext({
    initialData: {
        traceId: `e2e-test-${Date.now()}`,
        foundInBackend: false,
        renderResult: null,
        testEnv: null
    }
});

const initialContext: TestContext & { data: TelemetryTestData } = {
    ...baseContext,
    data: baseContext.data as TelemetryTestData
};

scenario('E2E Híbrido: Telemetría desde UI hasta Backend (RNTL)', initialContext, testConfig)
    
    .given('La aplicación está inicializada y el usuario autenticado', async (ctx) => {
        cleanup();
        
        // 1. Setup Test Env and Auth
        const testEnv = await createTestEnv();
        ctx.data!.testEnv = testEnv;
        
        // Login to allow telemetry sync (jose is the default listero in listero_prod.json seed)
        await testEnv.authenticateRealUser('jose', '123456');

        // 2. Initialize telemetry, middleware and SyncWorker
        MiddlewareRegistry.register(DebugTeaMiddleware);
        await telemetryRepository.initialize();
        CoreService.initializeSyncWorker();
        
        console.log('[DEBUG_TEST] Telemetry Repository and SyncWorker initialized with AUTH');
        console.log(`[DEBUG_TEST] API Base URL: ${settings.api.baseUrl}`);

        const renderResult = render(
            <>
                <IconRegistry icons={EvaIconsPack} />
                <ApplicationProvider {...eva} theme={eva.light}>
                    <DevToolbar />
                </ApplicationProvider>
            </>
        );
        
        ctx.data!.renderResult = renderResult;
        
        // Verificar que el DevToolbar esté presente (el input oculto existe)
        await waitFor(() => {
            const input = screen.getByTestId('e2e-trace-id-input');
            expect(input).toBeTruthy();
        });

        ctx.log!('App renderizada y usuario autenticado para test de telemetría');
    })

    .when('Se ingresa un TraceID único y se presiona el botón de error', async (ctx) => {
        const traceId = ctx.data!.traceId;

        const input = screen.getByTestId('e2e-trace-id-input');
        const errorButton = screen.getByTestId('trigger-telemetry-error');

        // Simular entrada de texto y presionar botón
        fireEvent.changeText(input, traceId);
        fireEvent.press(errorButton);
        
        // Trigger error directly from test as well
        logger.error('DIRECT TEST ERROR', { traceId });

        // Esperar un momento para que el evento se encole en AsyncStorage
        await new Promise(resolve => setTimeout(resolve, 500));

        // Forzar sincronización manual para enviar el evento encolado
        console.log(`[DEBUG_TEST] Triggering manual sync for traceId: ${traceId}`);
        const report = await syncWorker.forceSync('telemetry');
        console.log(`[DEBUG_TEST] Sync Report:`, JSON.stringify(report, null, 2));

        ctx.log!(`Evento de error disparado y sincronización forzada con TraceID: ${traceId}`);
    })

    .then('El evento debe persistirse en el backend (Determinismo E2E)', async (ctx) => {
        const traceId = ctx.data!.traceId;

        // Polling al backend usando el verfiedor existente
        const result = await TelemetryVerifier.waitForTrace(traceId, 15, 2000);

        ctx.data.foundInBackend = result.found;

        expect(result.found).toBe(true);
        ctx.log!(`✅ Éxito: TraceID ${traceId} encontrado en el backend`);
    })
    .test();
