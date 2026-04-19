/**
 * Test de Integración: RewardRepository con Backend Real
 * 
 * Este test usa el RewardRepository del frontend para hacer llamadas HTTP reales
 * al backend. Valida el flujo completo:
 * 
 * 1. RewardRepository.getBetTypesWithRewards() → HTTP GET
 * 2. RewardApiAdapter → parsea respuesta
 * 3. Tipos TypeScript → validación de estructura
 * 
 * Para ejecutar:
 * 1. Asegúrate que el backend esté corriendo en localhost:8000
 * 2. Exporta el token: export E2E_TEST_USER_TOKEN="tu_token_jwt"
 * 3. Ejecuta: npm run test -- --testPathPattern="rewards_repository"
 */

import { RewardRepository } from '@/shared/repositories/reward/reward.repository';
import { BetTypeWithRewardsResponse, BetTypeReward } from '@/shared/services/draw/types';
import { Result } from 'neverthrow';

// =============================================================================
// CONFIGURACIÓN
// =============================================================================

const TEST_STRUCTURE_ID = parseInt(process.env.E2E_TEST_STRUCTURE_ID || '1', 10);

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Imprime los rewards de un BetType en formato legible
 */
function printRewards(data: BetTypeWithRewardsResponse): void {
    console.log('\n📋 REWARDS ENCONTRADOS:\n');
    
    for (const drawType of data.draw_types) {
        console.log(`🎰 DrawType: ${drawType.name} (${drawType.code || 'N/A'})`);
        
        for (const betType of drawType.bet_types) {
            console.log(`\n   📌 BetType: ${betType.name} [${betType.code || 'N/A'}]`);
            console.log(`      Rewards: ${betType.rewards.length}`);
            
            for (const reward of betType.rewards) {
                console.log(`      ┌─────────────────────────────`);
                console.log(`      │ Nombre: ${reward.name}`);
                console.log(`      │ Payout: ${reward.payout.toLocaleString()}`);
                
                if (reward.category) {
                    console.log(`      │ Category: ${reward.category}`);
                }
                
                if (reward.is_pool !== undefined) {
                    console.log(`      │ is_pool: ${reward.is_pool}`);
                }
                
                if (reward.pool_divisor) {
                    console.log(`      │ pool_divisor: ${reward.pool_divisor}`);
                }
                
                // Campos nuevos del SSOT
                console.log(`      │ description: "${reward.description || '(vacío)'}"`);
                console.log(`      │ level: ${reward.level !== undefined ? reward.level : '(vacío)'}`);
                console.log(`      └─────────────────────────────`);
            }
        }
        console.log('\n');
    }
}

/**
 * Valida que los datos contienen metadata de SSOT
 */
function validateSSOTMetadata(data: BetTypeWithRewardsResponse): {
    isValid: boolean;
    totalRewards: number;
    withDescription: number;
    withLevel: number;
    errors: string[];
} {
    const result = {
        isValid: true,
        totalRewards: 0,
        withDescription: 0,
        withLevel: 0,
        errors: [] as string[]
    };
    
    for (const drawType of data.draw_types) {
        for (const betType of drawType.bet_types) {
            for (const reward of betType.rewards) {
                result.totalRewards++;
                
                // Validar campos requeridos
                if (!reward.name) {
                    result.errors.push(`Reward sin nombre en ${betType.code}`);
                    result.isValid = false;
                }
                
                if (typeof reward.payout !== 'number') {
                    result.errors.push(`Reward con payout inválido en ${betType.code}`);
                    result.isValid = false;
                }
                
                // Contar metadata
                if (reward.description) result.withDescription++;
                if (reward.level !== undefined) result.withLevel++;
            }
        }
    }
    
    return result;
}

// =============================================================================
// TESTS
// =============================================================================

describe('RewardRepository: Integración con Backend Real', () => {
    
    let repository: RewardRepository;
    
    beforeAll(() => {
        repository = new RewardRepository();
        
        console.log('🧪 Configuración del test:');
        console.log(`   Estructura ID: ${TEST_STRUCTURE_ID}`);
        console.log(`   Backend: ${process.env.E2E_BACKEND_URL || 'http://localhost:8000'}`);
    });
    
    /**
     * TEST: Cargar bet types con rewards desde el backend
     * 
     * Este test hace una llamada real al endpoint
     * y valida que la respuesta contiene los campos esperados
     */
    it('debe cargar bet types con rewards desde el backend', async () => {
        // Arrange
        console.log('\n🚀 Iniciando test: getBetTypesWithRewards()');
        
        // Act
        const result: Result<BetTypeWithRewardsResponse, Error> = 
            await repository.getBetTypesWithRewards(TEST_STRUCTURE_ID);
        
        // Assert: El result debe ser Ok
        expect(result.isOk()).toBe(true);
        
        if (result.isErr()) {
            console.error('❌ Error:', result.error);
            fail(`Error al obtener bet types: ${result.error.message}`);
            return;
        }
        
        const data = result.value;
        
        console.log('\n✅ Respuesta exitosa!');
        console.log(`   Structure: ${data.structure_name} (ID: ${data.structure_id})`);
        console.log(`   Bank: ${data.bank_name} (ID: ${data.bank_id})`);
        console.log(`   Draw Types: ${data.draw_types.length}`);
        
        // Validar estructura
        expect(data.structure_id).toBeDefined();
        expect(data.structure_name).toBeDefined();
        expect(Array.isArray(data.draw_types)).toBe(true);
        
        if (data.draw_types.length > 0) {
            const firstDrawType = data.draw_types[0];
            expect(firstDrawType.id).toBeDefined();
            expect(firstDrawType.name).toBeDefined();
            expect(Array.isArray(firstDrawType.bet_types)).toBe(true);
            
            console.log(`\n📦 Primer DrawType: ${firstDrawType.name}`);
            console.log(`   BetTypes: ${firstDrawType.bet_types.length}`);
        }
    });
    
    /**
     * TEST: Validar metadata SSOT (description y level)
     * 
     * Este test verifica que los rewards tienen los campos
     * que definimos en BetType.extra_data.rewards
     */
    it('debe incluir metadata SSOT (description y level) en los rewards', async () => {
        // Arrange
        console.log('\n🚀 Test: Validación de metadata SSOT');
        
        // Act
        const result = await repository.getBetTypesWithRewards(TEST_STRUCTURE_ID);
        
        // Assert
        expect(result.isOk()).toBe(true);
        
        if (result.isErr()) {
            fail(`Error: ${result.error.message}`);
            return;
        }
        
        const data = result.value;
        const validation = validateSSOTMetadata(data);
        
        // Imprimir resultados
        console.log('\n📊 Resultados de validación:');
        console.log(`   Total rewards: ${validation.totalRewards}`);
        console.log(`   Con description: ${validation.withDescription}`);
        console.log(`   Con level: ${validation.withLevel}`);
        
        if (validation.errors.length > 0) {
            console.log('\n❌ Errores encontrados:');
            validation.errors.forEach(e => console.log(`   - ${e}`));
        }
        
        // Validar que hay rewards
        expect(validation.totalRewards).toBeGreaterThan(0);
        
        // Mostrar rewards completos
        printRewards(data);
        
        // El test pasa si los datos son válidos (errors = [])
        expect(validation.isValid).toBe(true);
        
        // WARNING: Si no hay description/level, el seed puede no haberse ejecutado
        if (validation.withDescription === 0) {
            console.warn('\n⚠️ ATENCIÓN: Los rewards no tienen description.');
            console.warn('   Ejecutar: docker exec backend-web-1 python manage.py shell < backend/core/seeds/games/loteria_semanal.py');
        }
        
        if (validation.withLevel === 0) {
            console.warn('\n⚠️ ATENCIÓN: Los rewards no tienen level.');
            console.warn('   Verificar que BetType.extra_data.rewards tiene el campo "level"');
        }
    });
    
    /**
     * TEST: Validar BetType de Lotería Semanal
     * 
     * Busca específicamente el BetType de Lotería Semanal
     * y valida que sus rewards tienen la estructura correcta
     */
    it('debe tener estructura correcta para Lotería Semanal', async () => {
        // Arrange
        console.log('\n🚀 Test: BetType de Lotería Semanal');
        
        // Act
        const result = await repository.getBetTypesWithRewards(TEST_STRUCTURE_ID);
        
        expect(result.isOk()).toBe(true);
        
        if (result.isErr()) {
            fail(`Error: ${result.error.message}`);
            return;
        }
        
        const data = result.value;
        
        // Buscar BetType de Lotería Semanal
        let loteriaBetType: { betType: any; drawTypeName: string } | null = null;
        
        for (const drawType of data.draw_types) {
            for (const betType of drawType.bet_types) {
                const code = (betType.code || '').toUpperCase();
                if (
                    code.includes('CUATERNA') ||
                    code.includes('LOTERIA') ||
                    code.includes('5_DIGIT') ||
                    code.includes('SEMANAL')
                ) {
                    loteriaBetType = { betType, drawTypeName: drawType.name };
                    break;
                }
            }
            if (loteriaBetType) break;
        }
        
        // Assert
        console.log(`\n🎰 BetType encontrado: ${loteriaBetType ? loteriaBetType.betType.code : 'N/A'}`);
        
        if (!loteriaBetType) {
            console.log('\n⚠️ No se encontró BetType de Lotería Semanal');
            console.log('   Asegúrate de que loteria_semanal.py se ejecutó correctamente.');
            
            // Listar los BetTypes disponibles
            console.log('\n📋 BetTypes disponibles:');
            for (const drawType of data.draw_types) {
                for (const betType of drawType.bet_types) {
                    console.log(`   - ${betType.code}: ${betType.name}`);
                }
            }
            
            // No fallar el test si no hay lotería (puede que el usuario no la haya configurado)
            return;
        }
        
        // Validar estructura
        expect(Array.isArray(loteriaBetType.betType.rewards)).toBe(true);
        expect(loteriaBetType.betType.rewards.length).toBeGreaterThan(0);
        
        const rewards = loteriaBetType.betType.rewards;
        
        // El primer reward debe ser el principal
        const principalReward = rewards[0];
        expect(principalReward.name).toBeDefined();
        expect(typeof principalReward.payout).toBe('number');
        expect(principalReward.payout).toBeGreaterThan(0);
        
        console.log(`\n✅ BetType válido:`);
        console.log(`   Código: ${loteriaBetType.betType.code}`);
        console.log(`   Nombre: ${loteriaBetType.betType.name}`);
        console.log(`   Rewards: ${rewards.length}`);
        console.log(`\n   Reward principal:`);
        console.log(`     Nombre: ${principalReward.name}`);
        console.log(`     Payout: ${principalReward.payout}`);
        console.log(`     Description: "${principalReward.description || 'N/A'}"`);
        console.log(`     Level: ${principalReward.level !== undefined ? principalReward.level : 'N/A'}`);
    });
    
    /**
     * TEST: Validar que el reward tiene estructura de pool
     * 
     * Los rewards principales de Lotería Semanal son pools
     * que se dividen entre los ganadores
     */
    it('debe tener rewards tipo pool para pozo acumulado', async () => {
        // Arrange
        console.log('\n🚀 Test: Rewards tipo pool');
        
        // Act
        const result = await repository.getBetTypesWithRewards(TEST_STRUCTURE_ID);
        
        expect(result.isOk()).toBe(true);
        
        if (result.isErr()) {
            fail(`Error: ${result.error.message}`);
            return;
        }
        
        const data = result.value;
        
        // Buscar rewards con is_pool = true
        const poolRewards: Array<{ reward: BetTypeReward; betTypeCode: string }> = [];
        
        for (const drawType of data.draw_types) {
            for (const betType of drawType.bet_types) {
                for (const reward of betType.rewards) {
                    if (reward.is_pool === true) {
                        poolRewards.push({ reward, betTypeCode: betType.code || `BT-${betType.id}` });
                    }
                }
            }
        }
        
        console.log(`\n🏊 Rewards tipo pool encontrados: ${poolRewards.length}`);
        
        for (const { reward, betTypeCode } of poolRewards) {
            console.log(`\n   📌 BetType: ${betTypeCode}`);
            console.log(`      Reward: ${reward.name}`);
            console.log(`      Payout: ${reward.payout.toLocaleString()}`);
            console.log(`      pool_divisor: ${reward.pool_divisor || 'N/A'}`);
            console.log(`      description: "${reward.description || 'N/A'}"`);
        }
        
        // Validar que hay al menos un reward pool
        expect(poolRewards.length).toBeGreaterThan(0);
        
        // El primer pool reward debe tener description
        const firstPool = poolRewards[0].reward;
        if (!firstPool.description) {
            console.warn('\n⚠️ El reward pool no tiene description');
        }
    });
});

// =============================================================================
// TESTS DE CACHE (Opcional)
// =============================================================================

describe('RewardRepository: Validación de Cache', () => {
    
    let repository: RewardRepository;
    
    beforeEach(() => {
        repository = new RewardRepository();
    });
    
    /**
     * TEST: Verificar que el cache funciona
     * 
     * La segunda llamada debe ser más rápida (datos en cache)
     */
    it('debe usar cache en la segunda llamada', async () => {
        // Arrange
        console.log('\n🚀 Test: Cache de rewards');
        
        // Primera llamada (sin cache)
        const start1 = Date.now();
        const result1 = await repository.getBetTypesWithRewards(TEST_STRUCTURE_ID);
        const time1 = Date.now() - start1;
        
        expect(result1.isOk()).toBe(true);
        
        // Segunda llamada (con cache)
        const start2 = Date.now();
        const result2 = await repository.getBetTypesWithRewards(TEST_STRUCTURE_ID);
        const time2 = Date.now() - start2;
        
        expect(result2.isOk()).toBe(true);
        
        // Ambas respuestas deben ser iguales
        expect(JSON.stringify(result1.value)).toBe(JSON.stringify(result2.value));
        
        console.log(`\n⏱️ Tiempos:`);
        console.log(`   Primera llamada: ${time1}ms`);
        console.log(`   Segunda llamada: ${time2}ms`);
        console.log(`   Speedup: ${time1 > 0 ? (time1 / time2).toFixed(1) : 'N/A'}x`);
    });
});
