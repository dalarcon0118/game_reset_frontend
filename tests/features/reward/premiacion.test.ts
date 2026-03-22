import { createTestEnv } from '@/tests/utils/test-env';
import { drawRepository } from '@/shared/repositories/draw';
import { AuthRepository as authRepository } from '@/shared/repositories/auth';
import { betRepository } from '@/shared/repositories/bet/bet.repository';
import { winningsRepository } from '@/shared/repositories/bet/winnings.repository';
import { GameRegistry } from '@/shared/core/registry/game_registry';
import { BackendDraw } from '@/shared/repositories/draw/api/types/types';
import { BetMapper } from '@/shared/repositories/bet/bet.mapper';
import { normalizeBetType, normalizeBetTypeId, normalizeNumbers, normalizeOwnerStructure } from '@/shared/types/bet_types';
import { DEFAULT_LOTERIA_FIXED_AMOUNT } from '@/features/listero/bet-loteria/loteria/loteria.domain';

/**
 * 🌊 PremiacionTestFlow (Chain Pattern)
 * 
 * Este helper orquesta los pasos del test E2E de premiación,
 * reduciendo la carga cognitiva y permitiendo una lectura fluida.
 */
class PremiacionTestFlow {
    private testEnv: any;
    private listeroUser: any;
    private loteriaDraw: any;
    private betCount: number = 0;

    private constructor() { }

    static async start(): Promise<PremiacionTestFlow> {
        const flow = new PremiacionTestFlow();
        console.log('🚀 Iniciando entorno de test...');
        flow.testEnv = await createTestEnv();
        return flow;
    }

    async authenticate(username: string, pin: string): Promise<this> {
        console.log(`👤 Autenticando usuario: ${username}...`);
        this.listeroUser = await this.testEnv.authenticateRealUser(username, pin);
        return this;
    }

    async fetchAndSelectDraw(category: 'loteria' | 'bolita'): Promise<this> {
        console.log('📅 Buscando sorteos de hoy para categoría: loteria...');
        const userProfile = await authRepository.getMe();
        const structureId = userProfile?.structure?.id;

        if (!structureId) {
            throw new Error('No se pudo obtener el structureId del perfil del usuario.');
        }

        const drawsResult = await drawRepository.list({
            today: 'true',
            owner_structure: structureId
        });

        this.loteriaDraw = drawsResult.find((draw: BackendDraw) =>
            GameRegistry.getCategoryByDraw({
                code: draw.draw_type_details?.code,
                name: draw.name
            }) === category
        );

        if (!this.loteriaDraw) {
            console.warn(`No se encontró sorteo de ${category}, buscando cualquier sorteo activo...`);
            this.loteriaDraw = drawsResult.find(d => d.status === 'active' || d.status === 'scheduled');
        }

        if (!this.loteriaDraw) {
            throw new Error(`No se encontró ningún sorteo activo para proceder.`);
        }

        console.log(`✅ Sorteo seleccionado: ${this.loteriaDraw.name} (ID: ${this.loteriaDraw.id})`);
        return this;
    }

    async createBets(params: { bets: { number: string, amount?: number }[], betType?: string }): Promise<this> {
        const { bets, betType = 'LOTERIA' } = params;
        this.betCount = bets.length;

        console.log(`🎲 Preparando batch de ${bets.length} apuestas para ${betType}...`);

        // Obtenemos los tipos de apuesta del sorteo
        const betTypesResult = await drawRepository.getBetTypes(this.loteriaDraw.id);
        if (betTypesResult.isErr()) {
            throw new Error(`No se pudieron obtener los tipos de apuesta: ${betTypesResult.error.message}`);
        }

        // Buscar el tipo de apuesta según el juego (SSOT: GameRegistry)
        let selectedBetType = betTypesResult.value.find(t => (t.code || '').toUpperCase() === betType.toUpperCase());

        if (!selectedBetType) {
            // Fallback: Buscar por categoría
            selectedBetType = betTypesResult.value.find(t =>
                GameRegistry.getCategoryByDraw({ code: t.code, name: t.name }) === 'loteria'
            );
        }

        if (!selectedBetType) {
            throw new Error(`No se encontró tipo de apuesta para ${betType} en este sorteo.`);
        }

        // 🎰 Crear candidatos de apuesta (Real Flow: Batching con números variados)
        const candidates = bets.map(bet => ({
            drawId: this.loteriaDraw.id,
            betTypeId: selectedBetType!.id,
            type: selectedBetType!.code,
            numbers: bet.number,
            amount: bet.amount ?? DEFAULT_LOTERIA_FIXED_AMOUNT,
            ownerStructure: this.listeroUser.structure.id,
        }));

        console.log(`📦 Enviando batch de ${candidates.length} apuestas variadas al repositorio...`);

        // 🛡️ Normalización Centralizada vía BetMapper
        const placementBatchResult = BetMapper.toPlacementBatch(candidates);
        if (placementBatchResult.isErr()) {
            throw new Error(`Error al mapear batch: ${placementBatchResult.error.message}`);
        }

        const result = await betRepository.placeBatch(placementBatchResult.value);

        if (result.isErr()) {
            throw new Error(`Error al crear batch de apuestas: ${result.error.message}`);
        }

        console.log(`✅ Batch de ${candidates.length} apuestas variadas creado exitosamente.`);
        return this;
    }

    async syncBets(): Promise<this> {
        console.log('🔄 Sincronizando apuestas pendientes...');
        await betRepository.syncPending();
        console.log('✅ Sincronización completada.');
        return this;
    }

    async addWinningNumber(number: string): Promise<this> {
        console.log(`🎯 Agregando número ganador ${number} al sorteo ${this.loteriaDraw.id}...`);
        try {
            await drawRepository.addWinningNumbers(this.loteriaDraw.id, {
                winning_number: number,
                date: new Date().toISOString().split('T')[0]
            });
        } catch (error: any) {
            if (error.message?.includes('already has winning numbers')) {
                console.warn('⚠️ El sorteo ya tenía números ganadores. Continuando...');
            } else {
                throw error;
            }
        }
        return this;
    }

    async verifyWinnings(params: { waitMs?: number } = {}): Promise<void> {
        const { waitMs = 15000 } = params;
        console.log('🏆 Verificando resultados de premiación...');

        const userProfile = await authRepository.getMe();
        if (!userProfile) {
            throw new Error('No se pudo obtener el perfil del usuario para verificar premios.');
        }
        console.log(`👤 Verificando premios para usuario: ${userProfile.username} (ID: ${userProfile.id})`);
        console.log(`🏢 Estructura del usuario: ${userProfile.structure?.name} (ID: ${userProfile.structure?.id})`);

        // Esperar a que el backend procese la premiación
        console.log(`⏳ Esperando procesamiento en el servidor (${waitMs}ms)...`);
        await new Promise(resolve => setTimeout(resolve, waitMs));

        const winnings = await winningsRepository.getMyWinningsByDraw(this.loteriaDraw.id);
        console.log(`🔍 Respuesta del servidor: se encontraron ${winnings.length} registros de apuestas GANADORAS.`);

        // Aserciones: verificar que nuestras apuestas fueron creadas y premiadas
        if (winnings.length === 0) {
            console.error('❌ ERROR: No se encontraron apuestas ganadoras. Posibles causas:');
            console.error('   1. El cálculo de premios no ha terminado (aumentar waitMs).');
            console.error('   2. El número 25345 no fue detectado como ganador por el parser.');
            console.error('   3. Las apuestas no se asociaron a la estructura del usuario.');
        }

        expect(winnings.length).toBeGreaterThanOrEqual(1);

        // Verificar que el monto del premio es mayor a 0
        winnings.forEach(bet => {
            expect(bet.is_winner).toBe(true);
            expect(Number(bet.payout_amount)).toBeGreaterThan(0);
            console.log(`💰 Premio confirmado: ${bet.payout_amount} - Número: ${bet.numbers_played} - Tipo: ${bet.bet_type_details?.name}`);
        });

        console.log('🏁 Verificación de premiación exitosa. Test completado.');
    }
}

describe('Premiacion E2E Test (Functional Flow)', () => {
    test('Debe completar el flujo completo: Autenticación -> Apuestas -> Número Ganador -> Premiación', async () => {
        const flow = await PremiacionTestFlow.start();

        await flow.authenticate('jose', '123456');
        await flow.fetchAndSelectDraw('loteria');
        await flow.createBets({
            bets: [
                { number: '25345' },
                { number: '12345' },
                { number: '67890' },
                { number: '11111' },
                { number: '22222' }
            ],
            betType: 'LOTERIA'
        });
        await flow.syncBets();
        // 5. Agregar número ganador al sorteo (usando formato de espacio para Standard Parser)
        await flow.addWinningNumber('25 34 45'); // Mismo número para que sea ganadora
        await flow.verifyWinnings({ waitMs: 15000 });
    }, 180000); // Timeout extendido a 180s para E2E con procesamiento de backend
});

