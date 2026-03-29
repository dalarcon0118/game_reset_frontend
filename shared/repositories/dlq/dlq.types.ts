export type DlqItemStatus = 'pending' | 'reconciled' | 'discarded';

export interface DlqError {
    message: string;
    code?: string;
    status?: number;
    timestamp: number;
}

export interface DlqItem<T = any> {
    id: string;
    domain: string;
    entityId: string;
    payload: T;
    error: DlqError;
    status: DlqItemStatus;
    createdAt: number;
    updatedAt: number;
    ttlSeconds: number;
}

export interface DlqStats {
    total: number;
    pending: number;
    reconciled: number;
    discarded: number;
    expired: number;
}
