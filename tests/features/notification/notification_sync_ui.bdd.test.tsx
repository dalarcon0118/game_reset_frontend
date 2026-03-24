
import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react-native';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import * as eva from '@eva-design/eva';

import { scenario, setViewAdapter, createTestContext, TestContext } from '@/tests/core';
import { ScenarioConfig } from '@/tests/core/scenario';
import { betRepository } from '@/shared/repositories/bet';
import { notificationRepository } from '@/shared/repositories/notification';
import { CoreModule } from '@/core/core_module';
import { storeRegistry } from '@/shared/core/engine/store_registry';
import NotificationsScreen from '@/features/notification/screens/notifications_screen';

/**
 * BDD Integration Test: Offline Sync and Notifications
 * 
 * Part 1: Offline bet creation via repository and core module offline config
 * Part 2: UI test ensuring notifications are loaded from the repository and displayed
 */

// Configure view adapter for React Native
setViewAdapter('react-native');

/**
 * Context for the sync and notification test
 */
interface SyncNotificationTestData {
    online: boolean;
    initialPendingCount: number;
    finalPendingCount: number;
    notificationTitle: string;
    renderResult: any;
}

// Test configuration with extended timeout
const testConfig: ScenarioConfig = {
    timeout: 60000 
};

// Create initial context
const baseContext = createTestContext({
    initialData: {
        online: false,
        initialPendingCount: 0,
        finalPendingCount: 0,
        notificationTitle: 'Apuestas sincronizadas',
        renderResult: null
    }
});

const initialContext: TestContext & { data: SyncNotificationTestData } = {
    ...baseContext,
    data: baseContext.data as SyncNotificationTestData
};

scenario('Notificaciones - Sincronización offline y visualización en UI', initialContext, testConfig)
    
    // GIVEN 1: Sistema offline y apuestas pendientes
    .given('El sistema se encuentra en modo offline y se crean apuestas', async (ctx: any) => {
        // Simular modo offline vía CoreModule
        const coreStore = storeRegistry.get<any>('Core');
        if (coreStore) {
            coreStore.getState().dispatch({ type: 'SET_OFFLINE_MODE', payload: true });
        }
        ctx.data.online = false;

        // Crear una apuesta offline usando el repositorio directamente
        await betRepository.placeBet({
            drawId: '395',
            number: '42',
            amount: 50,
            type: 'simple'
        } as any);

        const pending = await betRepository.getPendingBets();
        ctx.data.initialPendingCount = pending.length;
        
        expect(ctx.data.initialPendingCount).toBeGreaterThan(0);
        ctx.log(`✅ Apuesta creada en modo offline (Pendientes: ${ctx.data.initialPendingCount})`);
    })

    // GIVEN 2: Repositorio de notificaciones configurado
    .given('El repositorio de notificaciones está listo para recibir alertas', async (ctx: any) => {
        // En una implementación real, esto podría implicar limpiar el storage de notificaciones local
        const initialNotifications = await notificationRepository.getNotifications();
        ctx.log(`✅ Repositorio de notificaciones listo (Notificaciones previas: ${initialNotifications.length})`);
    })

    // WHEN: Se recupera la conexión y se dispara el sync
    .when('Se recupera la conexión y el sistema sincroniza las apuestas pendientes', async (ctx: any) => {
        // Simular recuperación de conexión vía CoreModule
        const coreStore = storeRegistry.get<any>('Core');
        if (coreStore) {
            coreStore.getState().dispatch({ type: 'SET_OFFLINE_MODE', payload: false });
        }
        ctx.data.online = true;

        // Activar sincronización (lo que haría el core_module al detectar conexión)
        await betRepository.syncPending();
        
        const remainingPending = await betRepository.getPendingBets();
        ctx.data.finalPendingCount = remainingPending.length;
        
        expect(ctx.data.finalPendingCount).toBeLessThan(ctx.data.initialPendingCount);
        ctx.log('✅ Sincronización exitosa completada');
    })

    // THEN 1: Se debe haber generado una notificación en el repositorio
    .then('El repositorio de notificaciones debe registrar el éxito de la sincronización', async (ctx: any) => {
        const notifications = await notificationRepository.getNotifications();
        
        // Buscamos la notificación generada por la sincronización exitosa
        const syncNotification = notifications.find(n => 
            n.title.toLowerCase().includes('sincroniz') || 
            n.message.toLowerCase().includes('sincroniz')
        );
        
        expect(syncNotification).toBeDefined();
        if (syncNotification) {
            ctx.data.notificationTitle = syncNotification.title;
        }
        
        ctx.log('✅ Notificación de sincronización registrada en el repositorio');
    })

    // THEN 2: La notificación debe ser visible en la UI
    .then('La pantalla de notificaciones debe mostrar la alerta al usuario', async (ctx: any) => {
        cleanup();
        
        // Renderizar la pantalla de notificaciones
        render(
            <>
                <IconRegistry icons={EvaIconsPack} />
                <ApplicationProvider {...eva} theme={eva.light}>
                    <NotificationsScreen />
                </ApplicationProvider>
            </>
        );

        // Esperar a que la notificación aparezca en la lista
        await waitFor(() => {
            const notificationItem = screen.queryByText(new RegExp(ctx.data.notificationTitle, 'i'));
            expect(notificationItem).toBeTruthy();
        }, { timeout: 10000 });

        ctx.log('✅ Notificación visualizada correctamente en la interfaz de usuario');
    })

    .onSuccess(async (ctx: any) => {
        ctx.log('🎉 TEST BDD COMPLETADO: Flujo offline -> sync -> notificación UI verificado');
    })

    .test();
