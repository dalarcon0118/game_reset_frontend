import 'react-native-gesture-handler';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';
import Constants from 'expo-constants';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { logger } from '../shared/utils/logger';
import { registerReactNativeEvents } from '../shared/react-native-events';
import storageClient from '@core/offline-storage/storage_client';
import { authStorageAdapter } from '../shared/repositories/auth/adapters/auth.storage.adapter';

const log = logger.withTag('INIT');
const APP_VERSION_KEY = 'APP_VERSION_TRACKER';

/**
 * Checks if the app has been updated and clears the local cache if so.
 */
async function checkAppUpdate() {
    try {
        const currentVersion = Constants.expoConfig?.version;
        if (!currentVersion) {
            log.warn('Could not determine app version from expoConfig');
            return;
        }
        const storedVersion = await storageClient.get<string>(APP_VERSION_KEY);

        if (storedVersion !== currentVersion) {
            log.info(`Update detected: ${storedVersion || 'initial'} -> ${currentVersion}. Clearing local cache...`);

            // Clear local storage but keep session (unless you want to force re-login)
            await storageClient.clear();

            // Save the new version
            await storageClient.set(APP_VERSION_KEY, currentVersion);

            log.info('Local cache cleared successfully after update.');
        } else {
            log.debug(`No update detected. Version: ${currentVersion}`);
        }
    } catch (error) {
        log.error('Error during app update check', error);
    }
}

// Execute update check
checkAppUpdate();

// Setup EventSource for React Native
if (typeof window !== 'undefined') {
    (window as any).EventSource = EventSourcePolyfill;
} else {
    (global as any).EventSource = EventSourcePolyfill;
}
export const DevTools = {
    clearStorage: async () => {
        console.log('🗑️ Clearing storage...');
        try {
            await storageClient.clear();
            console.log('✅ Storage cleared successfully. Please reload the app.');
        } catch (e) {
            console.error('❌ Failed to clear storage:', e);
        }
    },
    clearSession: async () => {
        console.log('🔐 Clearing session (secure store)...');
        try {
            await authStorageAdapter.clearSession();
            console.log('✅ Session cleared successfully. Please reload the app.');
        } catch (e) {
            console.error('❌ Failed to clear session:', e);
        }
    },
    printStorage: async () => {
        console.log('🔍 Reading storage keys...');
        try {
            const keys = await storageClient.getAllKeys();
            console.log(`Keys found (${keys.length}):`, keys);
            for (const key of keys) {
                const val = await storageClient.get(key);
                // Use JSON.stringify for easier screenshot and structured view
                const stringifiedVal = JSON.stringify(val, null, 2);
                console.log(`📦 [${key}]:\n${stringifiedVal}\n---`);
            }
            console.log('✅ Storage dump completed.');
        } catch (e) {
            console.error('❌ Failed to read storage:', e);
        }
    },
    printFullStorage: async () => {
        console.log('🔍 Reading ALL storage data...');
        try {
            const keys = await storageClient.getAllKeys();
            const allData: Record<string, any> = {};
            for (const key of keys) {
                allData[key] = await storageClient.get(key);
            }
            console.log('📦 FULL STORAGE DUMP:\n', JSON.stringify(allData, null, 2));
            console.log('✅ Full storage dump completed.');
        } catch (e) {
            console.error('❌ Failed to read full storage:', e);
        }
    },
};



// Expose globally as direct functions AND under a namespace
const g = (global as any);
Object.assign(g, DevTools);
g.Dev = DevTools;
g.DevTools = DevTools;

// Also attach to window if available (for some debuggers)
if (typeof window !== 'undefined') {
    Object.assign(window, DevTools);
    (window as any).Dev = DevTools;
    (window as any).DevTools = DevTools;
}

console.log('🔧 DevTools: Call clearStorage(), Dev.clearStorage() or DevTools.clearStorage() in console');

// Register platform specific events for TEA
registerReactNativeEvents();

// Register global error handlers
// In development, we want to log to terminal even if RedBox appears
const originalHandler = (global as any).ErrorUtils?.getGlobalHandler();
if ((global as any).ErrorUtils) {
    (global as any).ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
        // Log to terminal via our logger
        logger.error(`Global Error Caught (${isFatal ? 'Fatal' : 'Non-fatal'})`, 'FATAL', error);

        // Call original handler to show RedBox on phone
        if (originalHandler) {
            originalHandler(error, isFatal);
        }
    });
}

// Catch unhandled promise rejections
const originalUnhandledRejection = (global as any).onunhandledrejection;
(global as any).onunhandledrejection = (error: any) => {
    logger.error('Unhandled Promise Rejection', 'GLOBAL', error);
    if (originalUnhandledRejection) originalUnhandledRejection(error);
};
