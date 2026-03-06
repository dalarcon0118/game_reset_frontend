import { AuthHandler } from '@/features/listero/listero-dashboard/core/handlers/auth.handler';
import { Model } from '@/features/listero/listero-dashboard/core/model';
import { RemoteData } from '@/shared/core/tea-utils';
import { DashboardUser } from '@/features/listero/listero-dashboard/core/user.dto';
import { DrawType, FinancialSummary } from '@/types';

// Mock del modelo inicial
const mockModel: Model = {
    draws: RemoteData.notAsked(),
    filteredDraws: [],
    summary: RemoteData.notAsked(),
    pendingBets: [],
    syncedBets: [],
    dailyTotals: {
        totalCollected: 0,
        premiumsPaid: 0,
        netResult: 0,
        estimatedCommission: 0,
        amountToRemit: 0,
    },
    userStructureId: null,
    statusFilter: 'open',
    appliedFilter: 'open',
    commissionRate: 0,
    showBalance: true,
    authToken: null,
    currentUser: null,
    isRateLimited: false,
};

describe('AuthHandler - Initial Load Trigger', () => {

    test('Should trigger fetch when user structure is synced AND token exists', () => {
        // Given
        const modelWithToken: Model = { ...mockModel, authToken: 'valid-token' };
        const user: DashboardUser = {
            id: '1',
            username: 'test',
            structureId: 'struct-1',
            role: 'listero',
            commissionRate: 0.15,
            name: 'Test User'
        };

        // When
        const result = AuthHandler.handleAuthUserSynced(modelWithToken, user);

        // Then
        // Expecting model to be Loading
        expect(result.model.draws.type).toBe('Loading');
        expect(result.model.summary.type).toBe('Loading');
    });

    test('Should trigger fetch when user structure is synced EVEN IF token is missing (API Client handles it)', () => {
        // Given
        const modelWithoutToken: Model = { ...mockModel, authToken: null };
        const user: DashboardUser = {
            id: '1',
            username: 'test',
            structureId: 'struct-1',
            role: 'listero',
            commissionRate: 0.15,
            name: 'Test User'
        };

        // When
        const result = AuthHandler.handleAuthUserSynced(modelWithoutToken, user);

        // Then
        // Expecting model to be Loading because we trust API Client to have/get the token
        expect(result.model.draws.type).toBe('Loading');
        expect(result.model.summary.type).toBe('Loading');
    });

    test('Should trigger fetch when token is updated AND structure exists', () => {
        // Given
        const modelWithStructure: Model = {
            ...mockModel,
            userStructureId: 'struct-1',
            draws: RemoteData.notAsked(),
            summary: RemoteData.notAsked()
        };
        const newToken = 'new-token';

        // When
        const result = AuthHandler.handleAuthTokenUpdated(modelWithStructure, newToken);

        // Then
        expect(result.model.authToken).toBe(newToken);
        expect(result.model.draws.type).toBe('Loading');
        expect(result.model.summary.type).toBe('Loading');
    });

    test('Should NOT trigger fetch when token is updated BUT structure is missing', () => {
        // Given
        const modelWithoutStructure: Model = {
            ...mockModel,
            userStructureId: null,
            draws: RemoteData.notAsked()
        };
        const newToken = 'new-token';

        // When
        const result = AuthHandler.handleAuthTokenUpdated(modelWithoutStructure, newToken);

        // Then
        expect(result.model.authToken).toBe(newToken);
        expect(result.model.draws.type).toBe('NotAsked');
    });
});
