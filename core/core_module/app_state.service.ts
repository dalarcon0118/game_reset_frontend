import { AppState, AppStateStatus } from 'react-native';
import { logger } from '@shared/utils/logger';
import { setAuthRepository } from './service';
import { deviceRepository } from '@shared/repositories/system/device';
import { sessionLockMediator } from './services/session-lock.mediator';

const log = logger.withTag('APP_STATE_SERVICE');
const BACKGROUND_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutos

interface AppStateServiceDeps {
    getAuthRepository: () => ReturnType<typeof setAuthRepository> extends void ? never : ReturnType<typeof setAuthRepository>;
    onSessionExpired: (reason: string) => void;
}

let _authRepoGetter: (() => any) | null = null;
let _onSessionExpiredCallback: ((reason: string) => void) | null = null;

class AppStateServiceImpl {
    private backgroundTimestamp: number | null = null;
    private timeoutCheckInterval: NodeJS.Timeout | null = null;
    private appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;
    private isSessionLocked = false;
    private wasTimeoutExceeded = false;

    start(deps?: AppStateServiceDeps): () => void {
        log.info('[APP_STATE_SERVICE] Starting background timeout monitor', { timeoutMs: BACKGROUND_TIMEOUT_MS });
        if (deps?.getAuthRepository) {
            _authRepoGetter = deps.getAuthRepository;
        }
        if (deps?.onSessionExpired) {
            _onSessionExpiredCallback = deps.onSessionExpired;
        }
        this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
        return this.stop.bind(this);
    }

    private handleAppStateChange(nextAppState: AppStateStatus): void {
        switch (nextAppState) {
            case 'background':
            case 'inactive':
                this.onEnterBackground();
                break;
            case 'active':
                this.onEnterForeground();
                break;
        }
    }

    private onEnterBackground(): void {
        if (this.backgroundTimestamp === null) {
            this.backgroundTimestamp = Date.now();
            log.info('[APP_STATE_SERVICE] App entered background, starting timeout timer', {
                timestamp: this.backgroundTimestamp,
                timeoutMs: BACKGROUND_TIMEOUT_MS
            });
            this.startTimeoutCheck();
        }
    }

    private onEnterForeground(): void {
        const backgroundStartTime = this.backgroundTimestamp;
        const wasInBackground = backgroundStartTime !== null;
        const backgroundDuration = wasInBackground ? Date.now() - backgroundStartTime : 0;

        log.info('[APP_STATE_SERVICE] App entered foreground', {
            wasInBackground,
            backgroundDurationMs: backgroundDuration,
            exceededTimeout: backgroundDuration >= BACKGROUND_TIMEOUT_MS
        });

        this.stopTimeoutCheck();
        this.backgroundTimestamp = null;

        if (this.isSessionLocked) {
            log.info('[APP_STATE_SERVICE] Session locked, forcing navigation to login');
            sessionLockMediator.forceNavigationToLogin();
            return;
        }

        if (wasInBackground && backgroundDuration >= BACKGROUND_TIMEOUT_MS) {
            log.warn('[APP_STATE_SERVICE] Background timeout exceeded, locking session', {
                backgroundDurationMs: backgroundDuration,
                thresholdMs: BACKGROUND_TIMEOUT_MS
            });
            this.lockSessionDueToTimeout();
        }
    }

    private startTimeoutCheck(): void {
        this.stopTimeoutCheck();
        this.timeoutCheckInterval = setInterval(() => {
            if (this.backgroundTimestamp === null) return;
            const elapsed = Date.now() - this.backgroundTimestamp;
            if (elapsed >= BACKGROUND_TIMEOUT_MS && !this.isSessionLocked) {
                log.warn('[APP_STATE_SERVICE] Background timeout threshold reached', { elapsedMs: elapsed, thresholdMs: BACKGROUND_TIMEOUT_MS });
                this.lockSessionDueToTimeout();
                this.stopTimeoutCheck();
            }
        }, 10000);
    }

    private stopTimeoutCheck(): void {
        if (this.timeoutCheckInterval) {
            clearInterval(this.timeoutCheckInterval);
            this.timeoutCheckInterval = null;
        }
    }

    private lockSessionDueToTimeout(): void {
        this.isSessionLocked = true;
        this.wasTimeoutExceeded = true;
        log.info('[APP_STATE_SERVICE] Locking session due to background timeout');

        try {
            if (deviceRepository && typeof deviceRepository.invalidateCache === 'function') {
                deviceRepository.invalidateCache();
                log.info('[APP_STATE_SERVICE] DeviceRepository cache invalidated to prevent UUID mismatch');
            } else {
                log.warn('[APP_STATE_SERVICE] DeviceRepository or invalidateCache not available');
            }

            if (_onSessionExpiredCallback) {
                sessionLockMediator.lock(_onSessionExpiredCallback, 'BACKGROUND_TIMEOUT');
                log.info('[APP_STATE_SERVICE] Session lock delegated to SessionLockMediator');
                return;
            }

            if (_authRepoGetter) {
                const authRepo = _authRepoGetter();
                if (authRepo) {
                    sessionLockMediator.lock(
                        (reason: string) => authRepo.notifySessionExpired(reason),
                        'BACKGROUND_TIMEOUT'
                    );
                    log.info('[APP_STATE_SERVICE] Session lock delegated to SessionLockMediator (via authRepo)');
                    return;
                }
            }

            log.error('[APP_STATE_SERVICE] No auth repo available to notify session expired');
            sessionLockMediator.forceNavigationToLogin();
        } catch (error) {
            log.error('[APP_STATE_SERVICE] Failed to notify session expired', { error });
            sessionLockMediator.forceNavigationToLogin();
        }
    }

    private getAuthRepo() {
        if (_authRepoGetter) {
            return _authRepoGetter();
        }
        return null;
    }

    stop(): void {
        log.info('[APP_STATE_SERVICE] Stopping background timeout monitor');
        this.stopTimeoutCheck();
        if (this.appStateSubscription) {
            this.appStateSubscription.remove();
            this.appStateSubscription = null;
        }
        this.backgroundTimestamp = null;
        this.isSessionLocked = false;
    }

    resetLockState(): void {
        this.isSessionLocked = false;
        sessionLockMediator.unlock();
        log.debug('[APP_STATE_SERVICE] Lock state reset');
    }

    hasJustRecoveredFromTimeout(): boolean {
        return this.wasTimeoutExceeded;
    }

    clearTimeoutRecoveryFlag(): void {
        this.wasTimeoutExceeded = false;
        log.debug('[APP_STATE_SERVICE] Timeout recovery flag cleared');
    }

    getBackgroundDuration(): number | null {
        if (this.backgroundTimestamp === null) return null;
        return Date.now() - this.backgroundTimestamp;
    }

    async ensureDeviceIdConsistency(): Promise<boolean> {
        if (!deviceRepository) return true;
        try {
            const cachedId = await deviceRepository.getUniqueId();
            const directId = await deviceRepository.getUniqueIdDirect();
            if (cachedId !== directId) {
                log.warn('[APP_STATE_SERVICE] Device ID mismatch detected, invalidating cache', { cachedId, directId });
                deviceRepository.invalidateCache();
                return false;
            }
            return true;
        } catch (error) {
            log.error('[APP_STATE_SERVICE] Error checking device ID consistency', { error });
            return false;
        }
    }
}

export const appStateService = new AppStateServiceImpl();