/**
 * Scenario: Verifica que las apuestas ganadoras reciben premio
 * 
 * Given: Usuario autenticado con sorteo seleccionado
 * When: Se crean apuestas con número ganador
 * Then: El sistema debe premiar las apuestas ganadoras
 */

import { scenario } from '@/tests/core';
import {
    PremiacionContext,
    createPremiacionContext,
    setupPremiacion,
    cleanupPremiacion,
    createBets,
    syncBets,
    addWinningNumber,
    getWinnings,
    filterWinningsByNumber
} from './helpers';

/**
 * Test positivo: apuesta con número 12345 debe ganar
 * 
 * Este scenario se puede:
 * 1. Ejecutar directamente: npx jest winners.scenario.ts
 * 2. Importar desde suite.ts y registrar en una suite
 */
export const winnersScenario = scenario<PremiacionContext>(
    'Premiación - Apuestas ganadoras reciben premio',
    createPremiacionContext(),
    { timeout: 300000 }
)

    // === GIVEN ===
    .given('Usuario autenticado y sorteo seleccionado', async (ctx) => {
        await setupPremiacion(ctx);
    })

    // === WHEN ===
    .when('Crear batch de apuestas con número 12345', async (ctx) => {
        await createBets(ctx, ['12345', '12345', '12345', '11111', '22222']);
    })

    .and('Sincronizar apuestas con el servidor', async (ctx) => {
        await syncBets(ctx);
    })

    .and('Agregar número ganador 12345', async (ctx) => {
        await addWinningNumber(ctx, '12345');
    })

    // === THEN ===
    .then('Verificar que las 3 apuestas con 12345 fueron premiadas', async (ctx) => {
        // Ejecutar el cálculo de premios en el servidor manualmente
        const executeRewardCmd = `docker exec backend-web-1 python manage.py shell -c "from use_cases.estimate_funds.calculate_reward import RewardCalculator; RewardCalculator(${ctx.draw!.id}).execute()"`;

        await new Promise((resolve) => {
            const { exec } = require('child_process');
            exec(executeRewardCmd, (error: any, stdout: string, stderr: string) => {
                if (error) {
                    console.error('RewardCalculator error:', stderr);
                }
                resolve(true);
            });
        });

        // Esperar procesamiento
        await new Promise(resolve => setTimeout(resolve, 5000));

        const winnings = await getWinnings(ctx);
        const winning12345 = filterWinningsByNumber(winnings, '12345');
        const filteredByDraw = winning12345.filter(w => w.draw === ctx.draw!.id);

        // Verificar que hay 3 apuestas ganadoras con número 12345
        expect(filteredByDraw.length).toBe(3);

        const expectedPayout = 2000000 / 3;

        filteredByDraw.forEach(bet => {
            expect(bet.is_winner).toBe(true);
            const actualPayout = Number(bet.payout_amount);
            expect(actualPayout).toBeCloseTo(expectedPayout, 2);
        });
    })

    // === CLEANUP ===
    .onSuccess(async (ctx) => {
        console.log('✅ Test de winners completado');
        await cleanupPremiacion(ctx);
    })

    .onFailed(async (ctx, error) => {
        console.log('❌ Test de winners falló:', error.message);
        await cleanupPremiacion(ctx);
    });
