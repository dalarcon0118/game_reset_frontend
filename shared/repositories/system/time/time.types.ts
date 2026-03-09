/**
 * Metadata for time synchronization and integrity.
 */
export interface TimeMetadata {
    /** The server time in ms from the last successful sync */
    lastServerTime: number;
    /** The client time in ms when the last server sync occurred */
    lastClientTime: number;
    anchorMonotonicMs?: number;
    /** (ServerTime - ClientTime) in ms */
    serverTimeOffset: number;
    /** When this metadata was last updated */
    lastSyncAt: number;
}

/**
 * Result of a time integrity check.
 */
export interface TimeIntegrityResult {
    status: 'ok' | 'backward' | 'jump';
    deltaMs: number;
    reason?: string;
}
