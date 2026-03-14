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
    /** When this metadata was last updated */
    lastSyncAt: number;
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

