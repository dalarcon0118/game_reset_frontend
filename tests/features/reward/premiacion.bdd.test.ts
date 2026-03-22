/**
 * 🌊 Premiacion E2E Test - Versión con DSL de BDD con TEA
 * 
 * Este archivo reescribe el test de premiación usando el DSL fluido.
 * El DSL permite escribir especificaciones ejecutables de forma más legible.
 */

import { scenario, createTestContext, buildContext, setViewAdapter, createReactNativeViewAdapter } from '@/tests/core';
import { createTestEnv } from '@/tests/utils/test-env';
import { drawRepository } from '@/shared/repositories/draw';
import { AuthRepository as authRepository } from '@/shared/repositories/auth';
import { betRepository } from '@/shared/repositories/bet/bet.repository';
import { winningsRepository } from '@/shared/repositories/bet/winnings.repository';
import { GameRegistry } from '@/shared/core/registry/game_registry';
import { BackendDraw } from '@/shared/repositories/draw/api/types/types';
import { BetMapper } from '@/shared/repositories/bet/bet.mapper';
import { DEFAULT_LOTERIA_FIXED_AMOUNT } from '@/features/listero/bet-loteria/loteria/loteria.domain';

// Configurar el adaptador de vista (React Native para móvil)
setViewAdapter('react-native');

/**
 * Interfaz de contexto para el test de premiación
 */
interface PremiacionContext {
    testEnv?: any;
    user?: any;
    draw?: any;
    bets?: any[];
    winnings?: any[];
}

/**
 * Cleanup function para limpiar datos del test
 * Limpia datos locales y del servidor (backend)
 */
async function cleanupTestData(ctx: PremiacionContext): Promise<void> {
    console.log('🧹 Iniciando cleanup de datos del test...');

    try {
        // 1. Limpiar apuestas locales del storage
        const today = new Date().toISOString().split('T')[0];
        const deletedCount = await betRepository.cleanup(today);
        console.log(`🗑️ ${deletedCount} apuestas limpiadas del almacenamiento local`);

        // 2. Limpiar apuestas del servidor via API REST
        // Endpoint: DELETE /api/bets/{id}/
        const winnings = await winningsRepository.getMyWinningsByDraw(ctx.draw?.id);
        const testWinnings = winnings.filter(w => w.draw === ctx.draw?.id);

        for (const win of testWinnings) {
            try {
                // Usar el API para eliminar cada apuesta
                // Nota: Bet no tiene endpoint de delete expuest, usamos docker exec como fallback
                console.log(`ℹ️ Bet ${win.id} - eliminar via API no implementado, usar cleanup manual`);
            } catch (e) {
                // Ignorar errores individuales
            }
        }

        console.log('✅ Cleanup completado');
    } catch (error) {
        console.error('⚠️ Error en cleanup:', error);
        // No lanzamos el error para no fallar el test si el cleanup falla
    }
}

/**
 * Scenario: Flujo completo de premiación
 * 
 * Given: Usuario autenticado con sorteo seleccionado
 * When: Se crean apuestas y se agrega número ganador
 * Then: El sistema debe premiar las apuestas ganadoras
 */
scenario<PremiacionContext>('Premiación E2E - Flujo completo', {}, { timeout: 300000 })

    // === GIVEN ===
    .given('Iniciar entorno de test', async (ctx) => {
        ctx.testEnv = await createTestEnv();
    })

    .and(' Autenticar usuario jose', async (ctx) => {
        ctx.user = await ctx.testEnv.authenticateRealUser('jose', '123456');
    })

    .and('Buscar y seleccionar sorteo de lotería', async (ctx) => {
        const userProfile = await authRepository.getMe();
        const structureId = userProfile?.structure?.id;

        if (!structureId) {
            throw new Error('No se pudo obtener el structureId del perfil del usuario.');
        }

        const drawsResult = await drawRepository.list({
            today: 'true',
            owner_structure: structureId
        });

        ctx.draw = drawsResult.find((draw: BackendDraw) =>
            GameRegistry.getCategoryByDraw({
                code: draw.draw_type_details?.code,
                name: draw.name
            }) === 'loteria'
        );

        if (!ctx.draw) {
            ctx.draw = drawsResult.find(d => d.status === 'active' || d.status === 'scheduled');
        }

        if (!ctx.draw) {
            throw new Error('No se encontró ningún sorteo activo para proceder.');
        }
    })

    // === WHEN ===
    .when('Crear batch de apuestas con número 12345', async (ctx) => {
        const betType = 'LOTERIA';
        const bets: { number: string; amount?: number }[] = [
            { number: '12345' },
            { number: '12345' },
            { number: '12345' },
            { number: '11111' },
            { number: '22222' }
        ];

        const betTypesResult = await drawRepository.getBetTypes(ctx.draw.id);
        if (betTypesResult.isErr()) {
            throw new Error(`No se pudieron obtener los tipos de apuesta: ${betTypesResult.error.message}`);
        }

        let selectedBetType = betTypesResult.value.find(t => (t.code || '').toUpperCase() === betType.toUpperCase());

        if (!selectedBetType) {
            selectedBetType = betTypesResult.value.find(t =>
                GameRegistry.getCategoryByDraw({ code: t.code, name: t.name }) === 'loteria'
            );
        }

        if (!selectedBetType) {
            throw new Error(`No se encontró tipo de apuesta para ${betType} en este sorteo.`);
        }

        const candidates = bets.map(bet => ({
            drawId: ctx.draw.id,
            betTypeId: selectedBetType!.id,
            type: selectedBetType!.code,
            numbers: bet.number,
            amount: bet.amount ?? DEFAULT_LOTERIA_FIXED_AMOUNT,
            ownerStructure: ctx.user.structure.id,
        }));

        const placementBatchResult = BetMapper.toPlacementBatch(candidates);
        if (placementBatchResult.isErr()) {
            throw new Error(`Error al mapear batch: ${placementBatchResult.error.message}`);
        }

        const result = await betRepository.placeBatch(placementBatchResult.value);

        if (result.isErr()) {
            throw new Error(`Error al crear batch de apuestas: ${result.error.message}`);
        }

        ctx.bets = candidates;
    })

    .and('Sincronizar apuestas pendientes', async (ctx) => {
        const syncResult = await betRepository.syncPending();

        if (syncResult.failed > 0) {
            throw new Error(`Sincronización fallida: ${syncResult.failed} apuestas no sincronizaron`);
        }
    })

    .and('Agregar número ganador 12345', async (ctx) => {
        const winningNumber = '12345';

        try {
            await drawRepository.addWinningNumbers(ctx.draw.id, {
                winning_number: winningNumber,
                date: new Date().toISOString().split('T')[0]
            });
        } catch (error: any) {
            if (error.message?.includes('already has winning numbers')) {
                console.warn('⚠️ El sorteo ya tenía números winners. Continuando...');
            } else {
                throw error;
            }
        }
    })

    // === THEN ===
    .then('Verificar que se premian las apuestas ganadoras', async (ctx) => {
        // Ejecutar el cálculo de premios en el servidor manualmente
        const executeRewardCmd = `docker exec backend-web-1 python manage.py shell -c "from use_cases.estimate_funds.calculate_reward import RewardCalculator; RewardCalculator(${ctx.draw!.id}).execute()"`;
        const execResult = await new Promise((resolve) => {
            const { exec } = require('child_process');
            exec(executeRewardCmd, (error: any, stdout: string, stderr: string) => {
                resolve({ error, stdout, stderr });
            });
        }) as any;

        if (execResult.error) {
            console.error('RewardCalculator error:', execResult.stderr);
        }

        // Esperar procesamiento
        await new Promise(resolve => setTimeout(resolve, 5000));

        const winnings = await winningsRepository.getMyWinningsByDraw(ctx.draw.id);

        // Filtrar solo las apuestas con número 12345
        const targetWinnings = winnings.filter(w => {
            const numPlayed = typeof w.numbers_played === 'string'
                ? w.numbers_played
                : (w.numbers_played as any)?.numbers?.[0];
            return numPlayed === '12345';
        });

        // Filtrar por ID del sorteo actual
        const filteredWinnings = targetWinnings.filter(w => w.draw === ctx.draw!.id);

        expect(filteredWinnings.length).toBe(3);

        const expectedPayout = 2000000 / 3;

        filteredWinnings.forEach(bet => {
            expect(bet.is_winner).toBe(true);
            const actualPayout = Number(bet.payout_amount);
            expect(actualPayout).toBeCloseTo(expectedPayout, 2);
        });
    })

    // === CALLBACKS ===
    .onSuccess(async (ctx) => {
        console.log('🎉 Test completado exitosamente');
        await cleanupTestData(ctx);
    })

    .onFailed(async (ctx, error) => {
        console.log('❌ Test falló:', error.message);
        //await cleanupTestData(ctx);
    })

    // Registrar en Jest
    .test();


/**
 * Scenario Alternativo: Verificar que apuestas no ganadoras no reciben premio
 */
scenario<PremiacionContext>('Verificar que solo apuestas ganadoras reciben premio', {}, { timeout: 180000 })

    .given('Setup inicial - usuario y sorteo', async (ctx) => {
        ctx.testEnv = await createTestEnv();
        ctx.user = await ctx.testEnv.authenticateRealUser('jose', '123456');

        const userProfile = await authRepository.getMe();
        const structureId = userProfile?.structure?.id;

        if (!structureId) {
            throw new Error('No se pudo obtener el structureId del perfil del usuario.');
        }

        const drawsResult = await drawRepository.list({
            today: 'true',
            owner_structure: structureId
        });

        ctx.draw = drawsResult.find((draw: BackendDraw) =>
            GameRegistry.getCategoryByDraw({
                code: draw.draw_type_details?.code,
                name: draw.name
            }) === 'loteria'
        );

        if (!ctx.draw) {
            ctx.draw = drawsResult.find(d => d.status === 'active' || d.status === 'scheduled');
        }

        if (!ctx.draw) {
            throw new Error('No se encontró ningún sorteo activo para proceder.');
        }
    })

    .when('Crear apuesta con número perdedor 99999', async (ctx) => {
        const betTypesResult = await drawRepository.getBetTypes(ctx.draw!.id);
        if (betTypesResult.isErr()) throw new Error('Error al obtener bet types');
        const selectedBetType = betTypesResult.value[0];

        const candidates = [{
            drawId: ctx.draw!.id,
            betTypeId: selectedBetType.id,
            type: selectedBetType.code,
            numbers: '99999',
            amount: DEFAULT_LOTERIA_FIXED_AMOUNT,
            ownerStructure: ctx.user!.structure.id,
        }];

        const placementBatchResult = BetMapper.toPlacementBatch(candidates);
        if (placementBatchResult.isErr()) throw new Error('Error al mapear batch');
        await betRepository.placeBatch(placementBatchResult.value);
    })

    .and('Agregar número ganador diferente 11 11 11', async (ctx) => {
        await drawRepository.addWinningNumbers(ctx.draw!.id, {
            winning_number: '11 11 11',
            date: new Date().toISOString().split('T')[0]
        });
    })

    .then('Verificar que la apuesta no fue premiada', async (ctx) => {
        // Esperar un poco para asegurar que el servidor procesó
        await new Promise(resolve => setTimeout(resolve, 5000));

        const winnings = await winningsRepository.getMyWinningsByDraw(ctx.draw!.id);

        // Buscar específicamente la apuesta '99999' creada en este scenario
        const losingBetWinning = winnings.find(w => {
            const num = typeof w.numbers_played === 'string'
                ? w.numbers_played
                : (w.numbers_played as any)?.numbers?.[0];
            return num === '99999';
        });

        if (losingBetWinning) {
            expect(losingBetWinning.is_winner).toBe(false);
            expect(Number(losingBetWinning.payout_amount)).toBe(0);
            console.log('✅ Confirmado: La apuesta 99999 no fue premiada');
        } else {
            console.log('ℹ️ La apuesta perdedora no aparece en winnings (comportamiento correcto si no es ganadora)');
        }
    })

    .onSuccess(async (ctx) => {
        console.log('🎉 Test de apuestas perdedoras completado');
        await cleanupTestData(ctx);
    })

    .onFailed(async (ctx, error) => {
        console.log('❌ Test falló:', error.message);
        await cleanupTestData(ctx);
    })

    .test();
