/**
 * Scenario: Verifica que las apuestas NO ganadoras NO reciben premio
 * Este test evita falsos positivos - asegura que el sistema NO premia apuestas perdedoras
 * 
 * Given: Usuario autenticado con sorteo seleccionado
 * When: Se crea apuesta con número diferente al ganador
 * Then: El sistema NO debe premiar la apuesta
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
 * Test negativo: apuesta con número 99999 NO debe ganar (ganador es 11111)
 * 
 * Este scenario se puede:
 * 1. Ejecutar directamente: npx jest losers.scenario.ts
 * 2. Importar desde suite.ts y registrar en una suite
 */
export const losersScenario = scenario<PremiacionContext>(
    'Premiación - Apuestas perdedoras NO reciben premio (evita falsos positivos)',
    createPremiacionContext(),
    { timeout: 180000 }
)

    // === GIVEN ===
    .given('Usuario autenticado y sorteo seleccionado', async (ctx) => {
        await setupPremiacion(ctx);
    })

    // === WHEN ===
    .when('Crear apuesta con número perdedor 99999', async (ctx) => {
        await createBets(ctx, ['99999']);
    })

    .and('Sincronizar apuesta con el servidor', async (ctx) => {
        await syncBets(ctx);
    })

    .and('Agregar número ganador diferente 11111', async (ctx) => {
        await addWinningNumber(ctx, '11111');
    })

    // === THEN ===
    .then('Verificar que la apuesta 99999 NO fue premiada', async (ctx) => {
        // Esperar procesamiento
        await new Promise(resolve => setTimeout(resolve, 5000));

        const winnings = await getWinnings(ctx);
        const losingBet = filterWinningsByNumber(winnings, '99999');
        const filteredByDraw = losingBet.filter(w => w.draw === ctx.draw!.id);

        if (filteredByDraw.length > 0) {
            // Si aparece en winnings, debe tener is_winner = false
            filteredByDraw.forEach(bet => {
                expect(bet.is_winner).toBe(false);
                expect(Number(bet.payout_amount)).toBe(0);
            });
            console.log('✅ Confirmado: La apuesta 99999 NO fue prémiada (payout = 0)');
        } else {
            // Si no aparece en winnings, es porque el sistema correctamente no la registró
            console.log('✅ Confirmado: La apuesta 99999 no aparece en winnings (comportamiento correcto)');
        }
    })

    // === CLEANUP ===
    .onSuccess(async (ctx) => {
        console.log('✅ Test de losers completado');
        await cleanupPremiacion(ctx);
    })

    .onFailed(async (ctx, error) => {
        console.log('❌ Test de losers falló:', error.message);
        await cleanupPremiacion(ctx);
    });
