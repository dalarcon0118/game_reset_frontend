import { scenario, createTestContext } from '@/tests/core';
import { telemetryRepository } from '@/shared/repositories/system/telemetry/telemetry.repository';
import { syncWorker } from '@core/offline-storage/instance';
import apiClient from '@/shared/services/api_client';
import { logger } from '@/shared/utils/logger';

/**
 * Escenario: Telemetría - Captura de errores críticos y sincronización diferida
 * 
 * Este test actúa como la especificación funcional para el sistema de telemetría técnica.
 * El objetivo es asegurar que los errores críticos (TEA, Time Skew, Storage) sean capturados
 * y persistidos offline para su posterior sincronización batch.
 */

scenario('Telemetría - Captura de errores críticos y sincronización diferida', createTestContext())
    .given('un entorno offline y el sistema de telemetría inicializado', async (ctx: any) => {
        // Simular estado offline usando el contexto de test
        ctx.data.isNetworkOnline = false;
        // El repositorio de telemetría debe ser capaz de inicializarse incluso offline
        await telemetryRepository.initialize();
    })
    
    /**
     * ESCENARIO 1: Integridad de la máquina de estados (TEA)
     * Detectar fallos en la lógica pura de update que podrían romper la UI.
     */
    .when('ocurre una excepción en el motor TEA durante un "update"', async (ctx: any) => {
        const teaError = new Error('Match error: Message LOGIN_FAILED not handled');
        const errorMetadata = { 
            traceId: 'tea-trace-123', 
            lastMsg: { type: 'LOGIN_FAILED', payload: { code: 500 } } 
        };

        // El logger debe interceptar esto y delegar al repositorio automáticamente
        logger.error('❌ UPDATE FAILED', teaError, errorMetadata);
        
        ctx.data.expectedErrorId = 'tea-trace-123';
    })
    .then('el error técnico se persiste localmente con contexto de trazabilidad', async (ctx: any) => {
        const storedErrors = await telemetryRepository.getPendingErrors();
        expect(storedErrors).toContainEqual(expect.objectContaining({
            type: 'TEA_UPDATE_FAILURE',
            context: expect.objectContaining({ traceId: 'tea-trace-123' })
        }));
    })

    /**
     * ESCENARIO 2: Inconsistencia Temporal (Time Skew)
     * Detectar si el usuario ha manipulado el reloj del dispositivo.
     */
    .when('se detecta una discrepancia mayor a 60s entre el reloj local y el servidor', async (ctx: any) => {
        // Simular detección de drift (ej: el usuario cambió la hora manual)
        await telemetryRepository.captureTimeSkew({
            localTimestamp: Date.now(),
            expectedTimestamp: Date.now() - 120000, // 2 min de diferencia
            source: 'DRAW_CLOSURE_VALIDATION'
        });
    })
    .then('se registra un evento de telemetría de alta prioridad para auditoría', async (ctx: any) => {
        const skewEvents = await telemetryRepository.getErrorsByType('TIME_SKEW');
        expect(skewEvents.length).toBeGreaterThan(0);
        expect(skewEvents[0].priority).toBe('HIGH');
    })

    /**
     * ESCENARIO 3: Sincronización Diferida (Batching)
     * Optimizar el uso de red enviando múltiples logs en una sola petición.
     */
    .when('el dispositivo recupera la conexión a internet', async (ctx: any) => {
        ctx.data.isNetworkOnline = true;
        
        // Mock del endpoint de telemetría
        (apiClient.post as jest.Mock).mockResolvedValue({ success: true });

        // Disparar ciclo de sincronización específico para telemetría
        await syncWorker.forceSync('telemetry');
    })
    .then('todos los errores acumulados se envían en un solo batch al servidor', async (ctx: any) => {
        expect(apiClient.post).toHaveBeenCalledWith(
            expect.stringContaining('/api/v1/system/telemetry/batch/'),
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
