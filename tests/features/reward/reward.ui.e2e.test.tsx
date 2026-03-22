/**
 * Test E2E para RewardScreen usando el DSL de BDD con TEA
 * 
 * Este test verifica el escenario completo:
 * 1. Loading inicial
 * 2. Número winner del sorteo
 * 3. Sección de apuestas ganadoras del usuario
 * 4. Código de voucher
 * 5. Hora de creación de la apuesta
 * 6. Montos a pagar (payout)
 * 7. Total general ganado
 * 8. Estado vacío cuando no hay ganancias
 */

import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react-native';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import * as eva from '@eva-design/eva';

import { scenario, setViewAdapter, createTestContext, TestContext } from '@/tests/core';
import { ScenarioConfig } from '@/tests/core/scenario';
import { setupPremiacion, PremiacionContext } from './scenarios/helpers';
import RewardScreen from '@/features/listero/bet-workspace/rewards/screen/reward';

// Configurar view adapter para React Native
setViewAdapter('react-native');

/**
 * Contexto para el test de RewardScreen
 */
interface RewardScreenTestData {
    drawId: string;
    winningNumber: string | null;
    hasWinnings: boolean;
    hasEmptyState: boolean;
    renderResult: any;
}

// Configuración del test con timeout extendido
const testConfig: ScenarioConfig = {
    timeout: 120000 // 2 minutos para test E2E
};

// ============================================================
// ESCENARIO PRINCIPAL: RewardScreen con apuestas ganadoras
// ============================================================

// Crear contexto inicial usando createTestContext
const baseContext = createTestContext({
    initialData: {
        drawId: '395',
        winningNumber: null,
        hasWinnings: false,
        hasEmptyState: false,
        renderResult: null
    }
});

const initialContext: TestContext & { data: RewardScreenTestData } = {
    ...baseContext,
    data: baseContext.data as RewardScreenTestData
};

scenario('RewardScreen carga correctamente y muestra apuestas ganadoras', initialContext, testConfig)
    
    // GIVEN: Usuario autenticado y sorteos disponibles
    .given('Usuario autenticado con sorteos disponibles', async (ctx: any) => {
        const premiacionCtx = {} as PremiacionContext;
        await setupPremiacion(premiacionCtx);
        
        ctx.data.drawId = '395';
        
        ctx.log('✅ Usuario autenticado y sorteos obtenidos');
    })

    // WHEN: Se renderiza la pantalla de premios
    .when('Se renderiza RewardScreen con drawId 395', (ctx: any) => {
        cleanup();
        
        // Renderizar el componente
        const renderResult = render(
            <>
                <IconRegistry icons={EvaIconsPack} />
                <ApplicationProvider {...eva} theme={eva.light}>
                    <RewardScreen drawId={ctx.data.drawId} />
                </ApplicationProvider>
            </>
        );
        
        ctx.data.renderResult = renderResult;
        
        ctx.log('✅ Pantalla de premios renderizada');
    })

    // THEN 1: Debe mostrar el spinner de carga inicial
    .then('Debe mostrar indicador de carga', async (ctx: any) => {
        await waitFor(() => {
            const loading = screen.queryByText(/Buscando premios/i);
            expect(loading).toBeTruthy();
        }, { timeout: 10000 });
        
        ctx.log('✅ Spinner de carga encontrado');
    })

    // THEN 2: Debe mostrar el número winner después de cargar
    .then('Debe mostrar el número winner del sorteo', async (ctx: any) => {
        await waitFor(() => {
            const winningNumber = screen.getByTestId('winning-number-display');
            expect(winningNumber).toBeTruthy();
            expect(winningNumber.props.children).toBeTruthy();
        }, { timeout: 30000 });
        
        ctx.log('✅ Número winner mostrado');
    })

    // THEN 3: Debe mostrar la sección de premios del usuario o estado vacío
    .then('Debe mostrar sección de premios o estado vacío', async (ctx: any) => {
        // Esperar a que carguen los winnings (puede tomar tiempo)
        await waitFor(() => {
            const hasWinningsHeader = screen.queryByTestId('winnings-header');
            const hasEmptyState = screen.queryByTestId('winnings-empty-state');
            
            // Al menos uno debe existir
            if (!hasWinningsHeader && !hasEmptyState) {
                throw new Error('Aún cargando winnings...');
            }
        }, { timeout: 30000 });
        
        const hasWinningsHeader = screen.queryByTestId('winnings-header');
        const hasEmptyState = screen.queryByTestId('winnings-empty-state');
        
        ctx.data.hasWinnings = !!hasWinningsHeader;
        ctx.data.hasEmptyState = !!hasEmptyState;
        
        expect(hasWinningsHeader || hasEmptyState).toBeTruthy();
        
        ctx.log(`✅ Sección de premios: ${hasWinningsHeader ? 'con ganancias' : 'vacía'}`);
    })

    // THEN 4: Si hay ganancias, verificar los detalles completos
    .then('Si hay ganancias, debe mostrar código de voucher, hora y montos de cada premio', async (ctx: any) => {
        if (!ctx.data.hasWinnings) {
            ctx.log('⚠️ Sin ganancias - saltando verificación de detalles');
            return;
        }
        
        // Verificar título de premios
        const winningsTitle = screen.queryByTestId('winnings-title');
        expect(winningsTitle).toBeTruthy();
        expect(winningsTitle?.props.children).toBe('TUS PREMIOS');
        ctx.log('✅ Título de premios verificado');
        
        // Verificar total general
        const totalPayout = screen.queryByTestId('total-payout');
        expect(totalPayout).toBeTruthy();
        const totalText = Array.isArray(totalPayout?.props.children) 
            ? totalPayout.props.children.join('') 
            : totalPayout?.props.children;
        expect(totalText).toMatch(/\$\d+/);
        ctx.log('✅ Total general verificado:', totalText);
        
        // Verificar código de voucher (primer receipt) - puede ser numérico o alfanumérico
        const receiptCode = screen.queryByTestId('receipt-code-0');
        expect(receiptCode).toBeTruthy();
        const codeText = Array.isArray(receiptCode?.props.children)
            ? receiptCode.props.children.join('')
            : receiptCode?.props.children;
        // El código puede ser #12345 o #IXI4O
        expect(codeText).toMatch(/#.+/);
        ctx.log('✅ Código de voucher verificado:', codeText);
        
        // Verificar hora de la apuesta (primer receipt)
        const timestamp = screen.queryByTestId('receipt-timestamp-0');
        expect(timestamp).toBeTruthy();
        const timeText = Array.isArray(timestamp?.props.children)
            ? timestamp.props.children.join('')
            : timestamp?.props.children;
        expect(timeText).toMatch(/\d{1,2}:\d{2}/);
        ctx.log('✅ Hora de la apuesta verificada:', timeText);
        
        // Verificar monto de la primera apuesta
        const payoutAmount = screen.queryByTestId('payout-amount-0-0');
        expect(payoutAmount).toBeTruthy();
        const payoutText = Array.isArray(payoutAmount?.props.children)
            ? payoutAmount.props.children.join('')
            : payoutAmount?.props.children;
        expect(payoutText).toMatch(/\+\$\d+/);
        ctx.log('✅ Monto del premio verificado:', payoutText);
    })

    // THEN 5: Verificar estado vacío si no hay ganancias
    .then('Si no hay ganancias, debe mostrar mensaje apropiado', async (ctx: any) => {
        if (ctx.data.hasWinnings) {
            ctx.log('⚠️ Con ganancias - saltando verificación de estado vacío');
            return;
        }
        
        const emptyText = screen.queryByTestId('winnings-empty-text');
        expect(emptyText).toBeTruthy();
        expect(emptyText?.props.children).toBe('No tienes premios en este sorteo');
        
        ctx.log('✅ Estado vacío verificado');
    })

    .onSuccess(async (ctx: any) => {
        console.log('🎉 TEST COMPLETADO: Todas las verificaciones pasaron');
        console.log('   - Draw ID:', ctx.data.drawId);
        console.log('   - Tiene ganancias:', ctx.data.hasWinnings);
        console.log('   - Estado vacío:', ctx.data.hasEmptyState);
    })

    .test();
