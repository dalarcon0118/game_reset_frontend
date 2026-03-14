import { WebData } from '@/shared/core/tea-utils/remote.data';

/**
 * Metadata for time synchronization and integrity.
 */
export interface TimeMetadata {
    /** The server time in ms from the last successful sync */
    lastServerTime: number;
    /** The client time in ms when the last server sync occurred */
    lastClientTime: number;
    /** (ServerTime - ClientTime) in ms */
    serverTimeOffset: number;
    /** The monotonic time in ms when the last server sync occurred (performance.now()) */
    anchorMonotonicMs?: number;
    /** The real system date when the metadata was last updated/verified */
    lastSyncAt: number;
    /** The last known trusted server time, used to detect backward jumps between sessions */
    lastKnownGoodServerTime?: number;
}

/**
 * TEA Model for Time Module
 */
export interface TimeModel {
    metadata: WebData<TimeMetadata>;
    status: 'ok' | 'backward' | 'jump';
    lastError?: string;
}

/**
 * Result of a time integrity check.
 */
export interface TimeIntegrityResult {
    status: 'ok' | 'backward' | 'jump';
    deltaMs: number;
    reason?: string;
}
