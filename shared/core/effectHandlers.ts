import { router } from 'expo-router';
import { Alert } from 'react-native';
import { Cmd } from './cmd';
import apiClient from '../services/ApiClient';
import { logger } from '../utils/logger';
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
            logger.error(`HTTP Request failed - missing payload`, 'HTTP');
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
            logger.error(`HTTP Request failed`, 'HTTP', error, { method, url });
            throw error;
        }
    },
    'TASK': async (payload: TaskPayload, dispatch: (cmd: Cmd) => void) => {
        if (!payload) {
            logger.error(`Task execution failed - missing payload`, 'TASK');
            return;
        }
        const { task, args, onSuccess, onFailure } = payload;

        // Validate that task is a function before calling it
        if (typeof task !== 'function') {
            const error = new Error(`Task execution failed: Expected function, got ${typeof task}`);
            logger.error(`Task execution failed - invalid task function`, 'TASK', error, { task, args });
            dispatch(onFailure(error));
            return;
        }

        try {
            const result = await task(...(args || []));
            dispatch(onSuccess(result));
        } catch (error) {
            logger.error(`Task execution failed`, 'TASK', error, { args });
            dispatch(onFailure(error));
        }
    },
    'ATTEMPT': async (payload: AttemptPayload, dispatch: (cmd: Cmd) => void) => {
        if (!payload) {
            logger.error(`Attempt failed - missing payload`, 'ATTEMPT');
            return;
        }
        const { task, args, onSuccess, onFailure } = payload;

        try {
            const [error, data] = await task(...(args || []));

            if (error) {
                logger.warn(`Attempt failed with error`, 'ATTEMPT', error);
                dispatch(onFailure(error));
            } else {
                dispatch(onSuccess(data));
            }
        } catch (error) {
            logger.error(`Attempt crashed unexpectedly`, 'ATTEMPT', error, { args });
            dispatch(onFailure(error));
        }
    },
    'NAVIGATE': async (payload: { pathname: string, params?: Record<string, any>, method?: 'push' | 'replace' | 'back' }) => {
        if (!payload) {
            logger.error(`Navigation failed - missing payload`, 'NAVIGATE');
            return;
        }
        const { pathname, params, method = 'push' } = payload;

        if (method === 'back') {
            router.back();
            return;
        }

        if (!pathname) {
            logger.error(`Navigation failed - missing pathname for method ${method}`, 'NAVIGATE', { payload });
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
            logger.warn(
                `Navigation blocked: Infinite loop or rapid redundant click detected to ${pathname}`,
                'NAVIGATE_GUARD',
                { pathname, params, elapsed: now - lastNavigation.timestamp }
            );
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
            logger.error(`Navigation failed - expo-router 'router' is undefined`, 'NAVIGATE');
            return;
        }

        try {
            if (method === 'replace') {
                router.replace({ pathname: pathname as any, params });
            } else {
                router.push({ pathname: pathname as any, params });
            }
        } catch (error) {
            logger.error(`Navigation failed - router error`, 'NAVIGATE', error, { pathname, method });
        }
    },
    'SLEEP': async (payload: { ms: number, msg: any }, dispatch: (msg: any) => void) => {
        if (!payload) {
            logger.error(`Sleep failed - missing payload`, 'SLEEP');
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
            logger.error(`Alert failed - missing payload`, 'ALERT');
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

        Alert.alert(title, message, rnButtons);
    }
};
