import { DlqItem, DlqItemStatus, DlqStats, DlqError } from './dlq.types';

export interface IDlqStorage {
    add<T>(domain: string, entityId: string, payload: T, error: DlqError, ttlSeconds?: number): Promise<string>;
    getById(id: string): Promise<DlqItem | null>;
    getByDomain(domain: string): Promise<DlqItem[]>;
    getAll(): Promise<DlqItem[]>;
    updateStatus(id: string, status: DlqItemStatus): Promise<void>;
    delete(id: string): Promise<void>;
    cleanup(): Promise<number>;
    getStats(): Promise<DlqStats>;
}

export interface IDlqApi {
    syncItems(items: DlqItem[]): Promise<{ success: number; failed: number }>;
    reportItem(domain: string, entityId: string, payload: any, error: any): Promise<void>;
    reconcile(id: string, resolution: 'reconcile' | 'discard'): Promise<void>;
}

export interface IDlqRepository {
    add<T>(domain: string, entityId: string, payload: T, error: DlqError): Promise<string>;
    getByDomain(domain: string): Promise<DlqItem[]>;
    getById(id: string): Promise<DlqItem | null>;
    getAll(): Promise<DlqItem[]>;
    markAsReconciled(id: string): Promise<void>;
    markAsDiscarded(id: string): Promise<void>;
    delete(id: string): Promise<void>;
    syncToBackend(): Promise<{ success: number; failed: number }>;
    cleanup(): Promise<number>;
    getStats(): Promise<DlqStats>;
}
