/**
 * Scenario: Banker Dashboard - Visualización y Flujo Operativo
 * 
 * Basado en la UH (User Story) para el Dashboard del Banquero.
 * Implementa los escenarios de BDD definidos en dashboard.feature.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import * as eva from '@eva-design/eva';

import { scenario, setViewAdapter } from '@/tests/core';
import {
    DashboardContext,
    createDashboardContext,
    setupBankerSession,
    cleanupBankerSession,
    createMsgWaiterMiddleware
} from './helpers';
import { globalSignalBus } from '@/shared/core/tea-utils/signal_bus';
import { SYSTEM_READY } from '@/config/signals';
import { BankerDashboardStoreProvider } from '@/features/banker/dashboard/core/store';
import { AuthModuleV1 } from '@/features/auth/v1';
import { NotificationModule } from '@/features/notification';
import { CoreModule } from '@/core/core_module';
import BankerDashboardScreen from '@/features/banker/dashboard/presentation/screens/banker_dashboard_screen';

// Configurar el adaptador de vista para React Native
setViewAdapter('react-native');

/**
 * 🛠️ Wrapper para renderizar con todos los Providers necesarios
 */
const renderWithProviders = (ctx: DashboardContext) => {
    return render(
        <>
            <IconRegistry icons={EvaIconsPack} />
            <ApplicationProvider {...eva} theme={eva.light}>
                <CoreModule.Provider storeApi={CoreModule.storeApi}>
                    <NotificationModule.Provider storeApi={NotificationModule.storeApi}>
                        <AuthModuleV1.Provider storeApi={AuthModuleV1.storeApi}>
                            <BankerDashboardStoreProvider storeApi={ctx.dashboardStoreApi}>
                                <BankerDashboardScreen />
                            </BankerDashboardStoreProvider>
                        </AuthModuleV1.Provider>
                    </NotificationModule.Provider>
                </CoreModule.Provider>
            </ApplicationProvider>
        </>
    );
};

export const bankerDashboardScenario = scenario<DashboardContext>(
    'Dashboard del Banquero - Integración Real con Mock Backend',
    createDashboardContext(),
    { timeout: 60000 }
)

    // === GIVEN ===
    .given('Un Banquero autenticado y el Dashboard renderizado', async (ctx) => {
        // 1. Preparar middleware para esperar a que el Dashboard procese la inicialización
        const { middleware, promise } = createMsgWaiterMiddleware('DATA_RECEIVED');
        ctx.waiterPromise = promise;

        // 2. Setup session and mock backend con el middleware
        await setupBankerSession(ctx, [middleware]);

        // 3. Renderizar el componente real
        renderWithProviders(ctx);
    })

    // === WHEN ===
    .when('El sistema emite la señal SYSTEM_READY (Carga de sesión completada)', async (ctx) => {
        // Disparamos la señal global que el Dashboard escucha vía Subscriptions
        globalSignalBus.send({
            type: SYSTEM_READY.toString(),
            payload: {
                structureId: String(ctx.user.structure.id),
                userName: ctx.user.username
            }
        }, { sticky: true });

        // 3. Esperamos a que el middleware de mensaje nos avise que llegó la data
        await ctx.waiterPromise;

        // 4. Verificamos que el estado del store sea Success
        await waitFor(() => {
            const state = ctx.dashboardStoreApi.getState().model;
            return state.summary.type === 'Success';
        }, { timeout: 10000 });
    })

    // === THEN ===
    .then('La UI debe mostrar las métricas financieras reales del repositorio', async (ctx) => {
        // 1. Verificación en la UI (Mirroring the Feature)
        const totalCollected = screen.getByTestId('stat-value-total-recaudado');
        const netProfit = screen.getByTestId('stat-value-ganancia-neta');

        // Los valores vienen del mockBackend (Agencia-A: 500, Agencia-B: 0 -> Total: 500)
        // El formateador usa $500.00
        expect(totalCollected.props.children).toContain('500');
        expect(netProfit.props.children).toContain('400');

        // 2. Verificación de SSoT (Model) - Opcional pero recomendado
        const model = ctx.dashboardStoreApi.getState().model;
        expect(model.summary.type).toBe('Success');
    })

    .and('El listado de colectores debe mostrar las agencias reales en pantalla', async (ctx) => {
        // 1. Verificación en la UI
        // El componente DashboardOperations muestra los nombres de las agencias
        const agenciaA = screen.getByText('Agencia-A');
        const agenciaB = screen.getByText('Agencia-B');

        expect(agenciaA).toBeDefined();
        expect(agenciaB).toBeDefined();

        // Verificamos que los datos de la agencia A sean correctos en el modelo
        const agencies = ctx.dashboardStoreApi.getState().model.agencies.data;
        const agenciaAData = agencies.find((a: any) => a.name === 'Agencia-A');
        expect(agenciaAData.total_collected).toBe(500.00);
    });
