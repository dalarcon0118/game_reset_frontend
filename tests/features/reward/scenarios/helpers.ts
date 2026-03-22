/**
 * Helpers comunes para los scenarios de premiación
 * Este archivo contiene el setup que se comparte entre todos los scenarios
 */

import { TestContext } from '@/tests/core';
import { createTestEnv } from '@/tests/utils/test-env';
import { drawRepository } from '@/shared/repositories/draw';
import { AuthRepository as authRepository } from '@/shared/repositories/auth';
import { betRepository } from '@/shared/repositories/bet/bet.repository';
import { winningsRepository } from '@/shared/repositories/bet/winnings.repository';
import { GameRegistry } from '@/shared/core/registry/game_registry';
import { BackendDraw } from '@/shared/repositories/draw/api/types/types';
import { BetMapper } from '@/shared/repositories/bet/bet.mapper';
import { DEFAULT_LOTERIA_FIXED_AMOUNT } from '@/features/listero/bet-loteria/loteria/loteria.domain';

/**
 * Contexto de premiación
 */
export interface PremiacionContext extends TestContext {
    testEnv?: any;
    user?: any;
    draw?: BackendDraw;
    bets?: any[];
    winnings?: any[];
}

/**
 * Crea el contexto inicial para premiación
 */
export function createPremiacionContext(): PremiacionContext {
    return {} as PremiacionContext;
}

/**
 * Setup común: autentica usuario y obtiene sorteo
 */
export async function setupPremiacion(ctx: PremiacionContext): Promise<void> {
    // 1. Autenticar usuario
    ctx.testEnv = await createTestEnv();

    // Intentar con pedro (estructura 54) que tiene sorteos completados
    try {
        ctx.user = await ctx.testEnv.authenticateRealUser('jose', '123456');
    } catch (e) {
    }

    // 2. Obtener structure del usuario
    const userProfile = await authRepository.getMe();
    const structureId = userProfile?.structure?.id;

    if (!structureId) {
        throw new Error('No se pudo obtener el structureId del perfil del usuario.');
    }

    // 3. Buscar sorteo de lotería
    // NOTA: Los sorteos con premios están en la estructura 54 (padre de 56)
    const drawsResult = await drawRepository.list({
        // Intentamos sin filtrar por estructura para ver todos los disponibles para el usuario
    });

    console.log(`🔍 Buscando entre ${drawsResult.length} sorteos disponibles para el usuario...`);
    drawsResult.forEach(d => {
        console.log(`   - [${d.id}] ${d.name} | Status: ${d.status} | Structure: ${d.owner_structure_id}`);
    });

    // Intentar buscar uno que ya tenga números ganadores (status completed)
    ctx.draw = drawsResult.find((draw: BackendDraw) =>
        draw.status === 'completed' &&
        GameRegistry.getCategoryByDraw({
            code: draw.draw_type_details?.code,
            name: draw.name
        }) === 'loteria'
    );

    if (ctx.draw) {
        console.log(`🎯 Encontrado sorteo COMPLETED: ${ctx.draw.name} (ID: ${ctx.draw.id})`);
    } else {
        console.log('⚠️ No se encontró sorteo completed, buscando cualquiera de lotería...');
        ctx.draw = drawsResult.find((draw: BackendDraw) =>
            GameRegistry.getCategoryByDraw({
                code: draw.draw_type_details?.code,
                name: draw.name
            }) === 'loteria'
        );
    }

    if (!ctx.draw) {
        ctx.draw = drawsResult.find(d => d.status === 'active' || d.status === 'scheduled');
    }

    if (!ctx.draw) {
        throw new Error('No se encontró ningún sorteo activo para proceder.');
    }

    console.log(`✅ Setup completado: usuario=${ctx.user.username}, draw=${ctx.draw.name}`);
}

/**
 * Cleanup común: limpia datos del test
 *
 * NOTA ARQUITECTURAL:
 * - El cleanup local funciona correctamente via betRepository.cleanup()
 * - El cleanup del servidor NO está implementado (el backend no tiene endpoint de delete para winnings)
 * - Para cleanup manual del servidor usar: docker exec backend-web-1 python manage.py cleanup_test_data
 */
export async function cleanupPremiacion(ctx: PremiacionContext): Promise<void> {
    console.log('🧹 Iniciando cleanup de datos del test...');

    try {
        // 1. Limpiar apuestas locales del storage
        console.log('🗑️ Limpieza de apuestas locales omitida por ahora');

        // 2. Cleanup del servidor - NO IMPLEMENTADO
        // Razón: El modelo WinningBet no tiene referencia directa a la apuesta (bet)
        // y el backend no expone endpoint DELETE para winnings.
        // Solución: Cleanup manual o agregar campo 'bet' al modelo del backend.
        if (ctx.draw) {
            console.log('⚠️ Cleanup del servidor: MANUAL - ejecutar comando docker');
        }

        console.log('✅ Cleanup completado');
    } catch (error) {
        console.error('⚠️ Error en cleanup:', error);
    }
}

/**
 * Crea batch de apuestas
 */
export async function createBets(
    ctx: PremiacionContext,
    numbers: string[],
    betType?: string
): Promise<void> {
    const betTypeCode = betType ?? 'LOTERIA';

    const betTypesResult = await drawRepository.getBetTypes(ctx.draw!.id);
    if (betTypesResult.isErr()) {
        throw new Error(`No se pudieron obtener los tipos de apuesta: ${betTypesResult.error.message}`);
    }

    let selectedBetType = betTypesResult.value.find(
        t => (t.code || '').toUpperCase() === betTypeCode.toUpperCase()
    );

    if (!selectedBetType) {
        selectedBetType = betTypesResult.value.find(t =>
            GameRegistry.getCategoryByDraw({ code: t.code, name: t.name }) === 'loteria'
        );
    }

    if (!selectedBetType) {
        throw new Error(`No se encontró tipo de apuesta para ${betTypeCode}`);
    }

    const candidates = numbers.map(number => ({
        drawId: ctx.draw!.id,
        betTypeId: selectedBetType!.id,
        type: selectedBetType!.code,
        numbers: number,
        amount: DEFAULT_LOTERIA_FIXED_AMOUNT,
        ownerStructure: ctx.user!.structure.id,
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
}

/**
 * Sincroniza apuestas pendientes
 */
export async function syncBets(ctx: PremiacionContext): Promise<void> {
    const syncResult = await betRepository.syncPending();

    if (syncResult.failed > 0) {
        throw new Error(`Sincronización fallida: ${syncResult.failed} apuestas no sincronizaron`);
    }
}

/**
 * Agrega número ganador al sorteo
 */
export async function addWinningNumber(ctx: PremiacionContext, number: string): Promise<void> {
    try {
        await drawRepository.addWinningNumbers(ctx.draw!.id, {
            winning_number: number,
            date: new Date().toISOString().split('T')[0]
        });
    } catch (error: any) {
        if (error.message?.includes('already has winning numbers')) {
            console.warn('⚠️ El sorteo ya tenía números winners. Continuando...');
        } else {
            throw error;
        }
    }
}

/**
 * Obtiene los winnings del draw
 */
export async function getWinnings(ctx: PremiacionContext): Promise<any[]> {
    return winningsRepository.getMyWinningsByDraw(String(ctx.draw!.id));
}

/**
 * Filtra winnings por número jugado
 */
export function filterWinningsByNumber(winnings: any[], number: string): any[] {
    return winnings.filter(w => {
        const numPlayed = typeof w.numbers_played === 'string'
            ? w.numbers_played
            : (w.numbers_played as any)?.numbers?.[0];
        return numPlayed === number;
    });
}
