/**
 * Helpers comunes para los scenarios del Dashboard de Listero
 * Este archivo contiene el setup que se comparte entre todos los scenarios
 */

import { TestContext } from '@/tests/core';
import { createTestEnv } from '@/tests/utils/test-env';
import { drawRepository } from '@/shared/repositories/draw';
import { BackendDraw } from '@/shared/repositories/draw/api/types/types';
import { AuthRepository as authRepository } from '@/shared/repositories/auth';
import { DashboardUser } from '@/features/listero/listero-dashboard/core/user.dto';

/**
 * Contexto del Dashboard
 */
export interface DashboardContext extends TestContext {
    testEnv?: any;
    user?: any;
    structureId?: string;
    draws?: BackendDraw[];
    token?: string;
    dashboardUser?: DashboardUser;
}

/**
 * Crea el contexto inicial para el dashboard
 */
export function createDashboardContext(): DashboardContext {
    return {} as DashboardContext;
}

/**
 * Setup común: autentica usuario y obtiene estructura
 */
export async function setupDashboard(ctx: DashboardContext): Promise<void> {
    // 1. Autenticar usuario
    ctx.testEnv = await createTestEnv();

    // Intentar con usuario existente
    try {
        ctx.user = await ctx.testEnv.authenticateRealUser('jose', '123456');
    } catch (e) {
        // Si falla, intentar con otro usuario
        try {
            ctx.user = await ctx.testEnv.authenticateRealUser('pedro', '123456');
        } catch (e2) {
            console.warn('⚠️ No se pudo autenticar usuario real');
        }
    }

    // 2. Obtener perfil del usuario y estructura
    const userProfile = await authRepository.getMe();
    const structureIdRaw = userProfile?.structure?.id;
    ctx.structureId = structureIdRaw ? String(structureIdRaw) : undefined;

    if (!ctx.structureId) {
        throw new Error('No se pudo obtener el structureId del perfil del usuario.');
    }

    // 3. Crear el DashboardUser (como lo hace el sistema)
    const userIdRaw = userProfile?.id;
    ctx.dashboardUser = {
        id: userIdRaw ? String(userIdRaw) : 'unknown',
        username: userProfile?.username || 'unknown',
        role: userProfile?.role || 'listero',
        structureId: ctx.structureId,
        commissionRate: userProfile?.structure?.commission_rate || 0.15,
        name: userProfile?.name
    };

    // 4. Obtener token de autenticación
    ctx.token = ctx.testEnv.getToken?.() || 'mock-token';

    console.log(`✅ Setup completado: usuario=${ctx.user?.username}, estructura=${ctx.structureId}`);
}

/**
 * Cleanup común: limpia datos del test
 */
export async function cleanupDashboard(ctx: DashboardContext): Promise<void> {
    console.log('🧹 Iniciando cleanup del test de dashboard...');

    try {
        // Limpiar estado del test
        ctx.testEnv = undefined;
        ctx.user = undefined;
        ctx.structureId = undefined;
        ctx.draws = undefined;
        ctx.token = undefined;
        ctx.dashboardUser = undefined;

        console.log('✅ Cleanup completado');
    } catch (error) {
        console.error('⚠️ Error en cleanup:', error);
    }
}

/**
 * Obtiene los sorteos disponibles para la estructura
 */
export async function getDrawsForStructure(ctx: DashboardContext): Promise<BackendDraw[]> {
    const drawsResult = await drawRepository.list({});

    console.log(`🔍 Obtenidos ${drawsResult.length} sorteos para el usuario`);

    ctx.draws = drawsResult;
    return drawsResult;
}
