import { LOGIN_SUCCESS, STRUCTURE_CHILDREN } from './responses';

/**
 * 🛠️ Mock Backend Engine
 * Intercepts fetch calls at the global level to simulate a real API.
 */

class MockBackend {
    private isInitialized = false;
    private originalFetch = global.fetch;

    /**
     * Start intercepting network requests
     */
    setup() {
        if (this.isInitialized) return;

        global.fetch = jest.fn().mockImplementation(async (url: string, options: any) => {
            const urlObj = new URL(url);
            const path = urlObj.pathname;
            const method = options?.method || 'GET';

            // 1. Auth Handlers
            if (path.includes('/api/auth/token/')) {
                return this.jsonResponse(200, LOGIN_SUCCESS);
            }

            // 2. Structure Handlers
            if (path.match(/\/api\/structures\/(\d+)\/children\//)) {
                console.log(`[MOCK_BACKEND] Matching children request: ${path}`);
                return this.jsonResponse(200, STRUCTURE_CHILDREN);
            }

            // Default fallback: 404
            console.warn(`[MOCK_BACKEND] Unhandled request: ${method} ${path}`);
            return this.jsonResponse(404, { error: 'Not Found' });
        }) as any;

        this.isInitialized = true;
        console.log('🌐 Mock Backend initialized and intercepting requests');
    }

    /**
     * Restore original fetch
     */
    teardown() {
        if (this.originalFetch) {
            global.fetch = this.originalFetch;
        }
        this.isInitialized = false;
        console.log('🌐 Mock Backend disabled');
    }

    private jsonResponse(status: number, data: any) {
        return Promise.resolve({
            ok: status >= 200 && status < 300,
            status,
            json: () => Promise.resolve(data),
            headers: new Headers({ 'content-type': 'application/json' }),
            text: () => Promise.resolve(JSON.stringify(data)),
        });
    }
}

export const mockBackend = new MockBackend();
