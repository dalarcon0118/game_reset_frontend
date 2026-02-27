import { updateAuth } from './update';
import { AuthModel, AuthMsgType, User } from './types';
import { Cmd } from '../../../shared/core/cmd';

describe('Auth Update Optimization', () => {
    const mockUser: User = {
        id: '123',
        username: 'testuser',
        role: 'listero'
    };

    const initialState: AuthModel = {
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        isLoggingOut: false,
        isOffline: false,
        error: null,
        loginSession: {
            username: '',
            pin: '',
            isSubmitting: false
        }
    };

    test('should preserve user reference if ID matches (ignoring other changes)', () => {
        // Given: A user with same ID but different role (simulating updated permissions)
        const updatedUser: User = {
            ...mockUser,
            role: 'admin' // Changed role!
        };

        // When: CHECK_AUTH_STATUS_RESPONSE_RECEIVED
        const [newState] = updateAuth(initialState, {
            type: AuthMsgType.CHECK_AUTH_STATUS_RESPONSE_RECEIVED,
            user: updatedUser
        });

        // Then: The reference MUST be the OLD one (optimization applied)
        expect(newState.user).toBe(mockUser); // Strict equality check
        expect(newState.user).not.toBe(updatedUser);
        
        // And: The role should still be the OLD one (side effect of optimization)
        expect(newState.user?.role).toBe('listero');
    });

    test('should update user reference if ID changes', () => {
        // Given: A completely different user
        const newUser: User = {
            id: '456',
            username: 'other',
            role: 'listero'
        };

        // When: CHECK_AUTH_STATUS_RESPONSE_RECEIVED
        const [newState] = updateAuth(initialState, {
            type: AuthMsgType.CHECK_AUTH_STATUS_RESPONSE_RECEIVED,
            user: newUser
        });

        // Then: The reference MUST be the NEW one
        expect(newState.user).toBe(newUser);
        expect(newState.user?.id).toBe('456');
    });
});
