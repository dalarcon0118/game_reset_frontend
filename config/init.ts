import 'react-native-gesture-handler';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { logger } from '../shared/utils/logger';
import { registerReactNativeEvents } from '../shared/react-native-events';

// Setup EventSource for React Native
if (typeof window !== 'undefined') {
    (window as any).EventSource = EventSourcePolyfill;
} else {
    (global as any).EventSource = EventSourcePolyfill;
}

// Initialize global logger capture to ensure all console.error/warn reach the terminal
if (__DEV__) {
    logger.initGlobalCapture();
    // logger.debugStorage(); // REMOVED: To prevent log noise
}

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
