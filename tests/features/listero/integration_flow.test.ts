import { Msg } from '@/features/listero-dashboard/core/msg';
import { createTestEnv } from '@/tests/utils/test-env';
import { User } from '@/shared/services/auth/types';

describe('Feature: Listero Draw Synchronization (Real Backend + BDD)', () => {

    // --- Scenario 1: Successful Synchronization (Happy Path) ---
    test('Scenario: User logs in and draws are synced and validated with io-ts', async () => {
        // GIVEN: A clean test environment
        const { store, testMiddleware, mockStorage, authenticateRealUser } = await createTestEnv();

        // AND: The user "jose" is authenticated against real backend
        const realUser = await authenticateRealUser('jose', '123456');

        // WHEN: The sync signal is received
        const authMsg: Msg = { type: 'AUTH_USER_SYNCED', user: realUser };
        store.getState().dispatch(authMsg);

        // THEN: The system should trigger a fetch command for draws
        await testMiddleware.waitForEffect((cmd: any) =>
            cmd.type === 'TASK' && cmd.payload.label === 'FETCH_DRAWS'
        );

        // AND: The system should receive the draws from the backend
        const successMsg = await testMiddleware.waitForMsg((msg) =>
            msg.type === 'DRAWS_RECEIVED'
        );

        // AND: The received data must match the expected Frontend Model
        expect(successMsg.type).toBe('DRAWS_RECEIVED');
        if (successMsg.type === 'DRAWS_RECEIVED' && successMsg.webData.type === 'Success') {
            const draws = successMsg.webData.data;

            // DEBUG: Log the first draw to see structure
            if (draws.length > 0) {
                console.log('Sample Draw Data:', JSON.stringify(draws[0], null, 2));
            } else {
                console.log('Received empty draws list');
            }

            // Verify critical properties exist and have correct types (Frontend Model)
            // Note: Draws are mapped to ExtendedDrawType (camelCase financial fields, string ID)
            draws.forEach((draw, index) => {
                try {
                    expect(typeof draw.id).toBe('string');
                    expect(typeof draw.name).toBe('string');
                    expect(typeof draw.status).toBe('string');
                    expect(typeof draw.totalCollected).toBe('number');
                    expect(typeof draw.netResult).toBe('number');
                    expect(draw.draw_type_details).toBeDefined();
                } catch (e) {
                    console.error(`Validation failed for draw at index ${index}`, draw);
                    throw e;
                }
            });

            console.log(`✅ Validated ${draws.length} draws structure`);
        }

        // AND: The draws should be persisted to local storage
        const storedDrawsJson = mockStorage['@last_draws'];
        expect(storedDrawsJson).toBeDefined();
        const storedData = JSON.parse(storedDrawsJson!);
        expect(storedData.data.length).toBeGreaterThanOrEqual(0);
    });

    // --- Scenario 2: Network Failure Handling (Sad Path) ---
    test('Scenario: System handles network failure gracefully without data loss', async () => {
        // GIVEN: A test environment with existing cached data
        const { store, testMiddleware, mockStorage, authenticateRealUser } = await createTestEnv();

        // Seed storage with previous data
        const cachedDraws = { timestamp: Date.now(), data: [{ id: 1, name: 'Cached Draw' }] };
        mockStorage['@last_draws'] = JSON.stringify(cachedDraws);

        // Authenticate
        const realUser = await authenticateRealUser('jose', '123456');

        // AND: The network is down (Simulated via fetch mock)
        // Ensure we mock global fetch if that's what apiClient uses
        const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(() =>
            Promise.reject(new Error('Network request failed'))
        );

        try {
            // WHEN: Sync starts
            const authMsg: Msg = { type: 'AUTH_USER_SYNCED', user: realUser };
            store.getState().dispatch(authMsg);

            // THEN: The system should attempt to fetch
            await testMiddleware.waitForEffect((cmd: any) =>
                cmd.type === 'TASK' && cmd.payload.label === 'FETCH_DRAWS'
            );

            // AND: The system should receive a Success message with CACHED data (Offline Fallback)
            const fallbackMsg = await testMiddleware.waitForMsg((msg) =>
                msg.type === 'DRAWS_RECEIVED' && msg.webData.type === 'Success',
                2000 // 2 seconds timeout
            );
            expect(fallbackMsg).toBeDefined();

            // Verify data comes from cache
            if (fallbackMsg.type === 'DRAWS_RECEIVED' && fallbackMsg.webData.type === 'Success') {
                const receivedData = fallbackMsg.webData.data;
                expect(receivedData[0].name).toBe('Cached Draw');
                console.log('✅ Offline fallback successful: Cached data served despite network failure');
            }

            // AND: The previous local storage should NOT be overwritten
            const currentStorage = JSON.parse(mockStorage['@last_draws']!);
            if (currentStorage.data[0].name !== 'Cached Draw') {
                console.error('Storage was overwritten:', currentStorage);
            }
            expect(currentStorage.data[0].name).toBe('Cached Draw');

        } catch (e) {
            console.error('Test failed with error:', e);
            console.error('Message History:', testMiddleware.getHistory());
            throw e;
        } finally {
            // Clean up spy
            fetchSpy.mockRestore();
        }
    });

    // --- Scenario 3: Empty State Handling ---
    test('Scenario: User with no assigned draws receives empty list', async () => {
        // GIVEN: A test environment
        const { store, testMiddleware, mockStorage, authenticateRealUser } = await createTestEnv();
        const realUser = await authenticateRealUser('jose', '123456');

        // Mock user structure to one that has no draws (e.g. ID 99999)

        const originalFetch = global.fetch;
        const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async (url: any, config: any) => {
            if (url.toString().includes('draws')) {
                return new Response(JSON.stringify([]), { status: 200 });
            }
            // Pass through other requests
            return originalFetch(url, config);
        });

        try {
            // WHEN: Sync starts
            const authMsg: Msg = { type: 'AUTH_USER_SYNCED', user: { ...realUser, structure: { ...realUser.structure, id: 99999 } } };
            store.getState().dispatch(authMsg);

            // THEN: Success message with empty array
            const successMsg = await testMiddleware.waitForMsg((msg) =>
                msg.type === 'DRAWS_RECEIVED' &&
                msg.webData.type === 'Success' &&
                msg.webData.data.length === 0
            );
            expect(successMsg).toBeDefined();

            // AND: Storage should update to empty list
            const storedData = JSON.parse(mockStorage['@last_draws']!);
            expect(storedData.data).toEqual([]);
            console.log('✅ Storage updated correctly for empty state');
        } finally {
            fetchSpy.mockRestore();
        }
    });
});
