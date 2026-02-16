
import { AppKernel } from './kernel';
import { restDataProvider } from './adapters';
import { DataProvider, AuthProvider, NotificationProvider } from './interfaces';
import { logger } from '@/shared/utils/logger';

// --- Default Implementations (Adapters) ---

// 1. Auth Adapter (wrapping existing services)
const authAdapter: AuthProvider = {
    login: async (params) => {
        // Delegate to existing LoginService
        // return LoginService.login(params);
        return Promise.resolve(); // Placeholder
    },
    logout: async () => {
        // Delegate to existing LoginService
        return Promise.resolve();
    },
    checkError: async (error) => {
        if (error.status === 401) {
            // Handle redirect
        }
    },
    checkAuth: async () => {
        // Check token existence
        return Promise.resolve();
    },
    getPermissions: async () => Promise.resolve([]),
    getUserIdentity: async () => Promise.resolve({ id: 1, name: 'User' })
};

// 2. Notification Adapter
const notificationAdapter: NotificationProvider = {
    open: (params) => {
        logger.info(`[Notification] ${params.message}`, 'UI');
        // Integrate with UI-Kitten or Toast library here
    },
    close: (key) => {}
};

/**
 * BOOTSTRAP FUNCTION
 * This is the entry point for wiring up the Clean Architecture.
 * Call this before mounting the React App.
 */
export const bootstrapArchitecture = () => {
    logger.info('Bootstrapping App Architecture...', 'BOOTSTRAP');

    AppKernel.configure({
        dataProvider: restDataProvider,
        authProvider: authAdapter,
        notificationProvider: notificationAdapter,
        resources: [
            { name: 'games', list: '/games', show: '/games/:id' },
            { name: 'bets', list: '/bets', create: '/bets' },
            { name: 'users', list: '/users' }
        ]
    });

    logger.info('App Architecture Ready', 'BOOTSTRAP');
};
