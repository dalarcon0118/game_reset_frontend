import { TestContext } from '@/tests/core';
import { createTestEnv } from '@/tests/utils/test-env';
import { createElmStore } from '@core/engine/engine';
import { effectHandlers } from '@core/tea-utils';
import { bankerDashboardDefinition } from '@/features/banker/dashboard/core/store';
import { mockBackend } from './backend';

/**
 * 🛠️ Middleware para esperar mensajes específicos en el Store (TEA)
 */
export function createMsgWaiterMiddleware(targetType: string) {
    let resolve: () => void;
    const promise = new Promise<void>(r => resolve = r);

    const middleware = {
        id: `waiter-${targetType}-${Math.random()}`,
        afterUpdate: (_prev: any, msg: any) => {
            if (msg && msg.type === targetType) {
                resolve();
            }
        }
    };

    return { middleware, promise };
}

/**
 * Context for Banker Dashboard Tests
 */
export interface DashboardContext extends TestContext {
    testEnv?: any;
    user?: any;
    dashboardStoreApi?: any;
}

/**
 * Creates initial context for Dashboard
 */
export function createDashboardContext(): DashboardContext {
    return {} as DashboardContext;
}

/**
 * Setup a Banker session for testing using the Mock Backend
 */
export async function setupBankerSession(ctx: DashboardContext, extraMiddlewares: any[] = []): Promise<void> {
    // 1. Initialize Mock Backend to intercept API calls
    mockBackend.setup();

    // 2. Create test environment
    ctx.testEnv = await createTestEnv();

    // 3. Initialize BankerDashboard Store (TEA) con middleware de log para debug
    ctx.dashboardStoreApi = createElmStore({
        initial: bankerDashboardDefinition.initial,
        update: bankerDashboardDefinition.update,
        subscriptions: bankerDashboardDefinition.subscriptions || (() => null),
        effectHandlers: effectHandlers as any,
        middlewares: [
            ...extraMiddlewares,
            {
                id: 'test-logger',
                afterUpdate: (_prev, msg) => {
                    if (msg) {
                        console.log(`[TEST-STORE] Msg processed: ${msg.type}`, JSON.stringify(msg).substring(0, 200));
                    }
                }
            }
        ]
    });

    // 4. Perform real login flow (now intercepted by mockBackend)
    ctx.user = await ctx.testEnv.authenticateRealUser('jose', '123456');
}

/**
 * Cleans up Banker session and restores network
 */
export async function cleanupBankerSession(ctx: DashboardContext): Promise<void> {
    if (ctx.testEnv) {
        await ctx.testEnv.cleanup();
    }
    mockBackend.teardown();
}
