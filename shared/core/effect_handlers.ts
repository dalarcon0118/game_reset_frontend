import { router } from 'expo-router';
import { Alert } from 'react-native';
import { Cmd } from './cmd';
import apiClient from '../services/api_client';
import { logger } from '../utils/logger';
import { navigationRef } from '../navigation/navigation_service';

const log = logger.withTag('EFFECTS');

export interface TaskPayload {
    task: (...args: any[]) => Promise<any>,
    args?: any[],
    onSuccess: (data: any) => any,
    onFailure: (error: any) => any
}
export interface AttemptPayload {
    task: (...args: any[]) => Promise<[any, any]>,
    args?: any[],
    onSuccess: (data: any) => any,
    onFailure: (error: any) => any
}
export interface HttpPayload {
    url: string;
    method: string;
    body?: any;
    headers?: Record<string, string>;
    cacheTTL?: number;
    retryCount?: number;
    abortSignal?: AbortSignal;
    msgCreator?: any;
}

// Navigation Guard State
let lastNavigation = {
    pathname: '',
    params: JSON.stringify({}),
    timestamp: 0
};

const NAVIGATION_THRESHOLD_MS = 500;

export const effectHandlers = {
    'MSG': async (payload: any, dispatch: (msg: any) => void) => {
        dispatch(payload);
    },
    'HTTP': async (payload: HttpPayload) => {
        if (!payload) {
            log.error('HTTP Request failed - missing payload');
            throw new Error('HTTP effect requires a payload');
        }
        const { url, method, body, headers, cacheTTL, retryCount, abortSignal } = payload;

        try {
            const response = await apiClient.request(url, {
                method,
                body: body,
                headers: headers,
                cacheTTL,
                retryCount,
                abortSignal
            });
            return response;
        } catch (error) {
            log.error('HTTP Request failed', error, { method, url });
            throw error;
        }
    },
    'TASK': async (payload: TaskPayload, dispatch: (cmd: Cmd) => void) => {
        if (!payload) {
            log.error('Task execution failed - missing payload');
            return;
        }
        const { task, args, onSuccess, onFailure } = payload;

        // Validate that task is a function before calling it
        if (typeof task !== 'function') {
            const error = new Error(`Task execution failed: Expected function, got ${typeof task}`);
            log.error('Task execution failed - invalid task function', error, { task, args });
            dispatch(onFailure(error));
            return;
        }

        try {
            const result = await task(...(args || []));
            dispatch(onSuccess(result));
        } catch (error) {
            // Only log if it's NOT a business-expected error (like 404 in some contexts)
            const isExpectedError = (error as any)?.status === 404;
            if (!isExpectedError) {
                log.error('Task execution failed', error, { args });
            }
            dispatch(onFailure(error));
        }
    },
    'ATTEMPT': async (payload: AttemptPayload, dispatch: (cmd: Cmd) => void) => {
        if (!payload) {
            log.error('Attempt failed - missing payload');
            return;
        }
        const { task, args, onSuccess, onFailure } = payload;

        try {
            const [error, data] = await task(...(args || []));
            if (error) {
                log.error('Attempt task returned error', error, { args });
                dispatch(onFailure(error));
            } else {
                dispatch(onSuccess(data));
            }
        } catch (error) {
            log.error('Attempt execution crashed', error, { args });
            dispatch(onFailure(error));
        }
    },
    'NAVIGATE': async (payload: { pathname: string, params?: Record<string, any>, method?: 'push' | 'replace' | 'back' }) => {
        log.debug('Handler called with payload', { payload });

        if (!payload) {
            log.error('Navigation failed - missing payload');
            return;
        }
        const { pathname, params, method = 'push' } = payload;

        // --- Navigation Readiness Guard ---
        // Intentamos esperar a que el sistema esté listo, pero no bloqueamos si navigationRef no está vinculado.
        // El bucle interno manejará la condición de carrera real de Expo Router.
        let attempts = 0;
        const MAX_ATTEMPTS = 5;
        const RETRY_DELAY_MS = 100;

        while (!navigationRef.isReady() && attempts < MAX_ATTEMPTS) {
            log.warn(`Navigation system not ready (navigationRef), retrying in ${RETRY_DELAY_MS}ms... (Attempt ${attempts + 1}/${MAX_ATTEMPTS})`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            attempts++;
        }
        // ----------------------------------

        if (method === 'back') {
            log.debug('Going back');
            router.back();
            return;
        }

        if (!pathname) {
            log.error(`Navigation failed - missing pathname for method ${method}`, { payload });
            return;
        }

        // --- Navigation Guard Implementation ---
        const now = Date.now();
        const currentParamsStr = JSON.stringify(params || {});

        if (
            pathname === lastNavigation.pathname &&
            currentParamsStr === lastNavigation.params &&
            (now - lastNavigation.timestamp) < NAVIGATION_THRESHOLD_MS
        ) {
            log.warn('Navigation blocked: Infinite loop or rapid redundant click detected', { pathname, params, elapsed: now - lastNavigation.timestamp });
            return;
        }

        // Update last navigation state
        lastNavigation = {
            pathname,
            params: currentParamsStr,
            timestamp: now
        };
        // ----------------------------------------

        if (!router) {
            log.error("Navigation failed - expo-router 'router' is undefined");
            return;
        }

        try {
            log.debug('Calling router.' + method, { pathname, params });

            // Inner retry loop specifically for Expo Router's Root Layout race condition
            let innerAttempts = 0;
            const MAX_INNER_ATTEMPTS = 5;

            while (innerAttempts < MAX_INNER_ATTEMPTS) {
                try {
                    if (method === 'replace') {
                        router.replace({ pathname: pathname as any, params });
                    } else {
                        router.push({ pathname: pathname as any, params });
                    }
                    log.debug('Router call completed successfully');
                    return; // Success!
                } catch (e: any) {
                    const isMountError = e?.message?.includes('mounting the Root Layout');
                    if (isMountError && innerAttempts < MAX_INNER_ATTEMPTS - 1) {
                        innerAttempts++;
                        log.warn(`Expo Router mount race condition detected, retrying inner... (${innerAttempts}/${MAX_INNER_ATTEMPTS})`);
                        await new Promise(resolve => setTimeout(resolve, 100));
                        continue;
                    }
                    throw e; // Rethrow if it's not a mount error or we're out of retries
                }
            }
        } catch (error) {
            log.error('Navigation failed - router error', error, { pathname, method });
        }
    },
    'SLEEP': async (payload: { ms: number, msg: any }, dispatch: (msg: any) => void) => {
        if (!payload) {
            log.error('Sleep failed - missing payload');
            return;
        }
        const { ms, msg } = payload;
        await new Promise(resolve => setTimeout(resolve, ms));
        dispatch(msg);
    },
    'ALERT': async (payload: {
        title: string,
        message: string,
        buttons?: { text: string, onPressMsg?: any, style?: 'default' | 'cancel' | 'destructive' }[]
    }, dispatch: (msg: any) => void) => {
        if (!payload) {
            log.error('Alert failed - missing payload');
            return;
        }
        const { title, message, buttons } = payload;

        const rnButtons = buttons?.map(btn => ({
            text: btn.text,
            style: btn.style,
            onPress: () => {
                if (btn.onPressMsg) {
                    dispatch(btn.onPressMsg);
                }
            }
        }));

        log.info(`Showing Alert: ${title}`, { message });
        Alert.alert(title, message, rnButtons);
    }
};
