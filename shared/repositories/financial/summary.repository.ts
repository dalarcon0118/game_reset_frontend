import { FinancialSummary } from '@/types';
import { FinancialSummaryApi } from './api/api';
import { SummaryOfflineAdapter } from './adapters/summary.offline.adapter';
import { logger } from '@/shared/utils/logger';
import { Result, ok, err } from 'neverthrow';
import { isServerReachable } from '@/shared/utils/network';

const log = logger.withTag('SummaryRepository');

export interface ISummaryRepository {
    getSummary(structureId: string | number, date?: string): Promise<Result<FinancialSummary, Error>>;
}

export class OfflineFirstSummaryRepository implements ISummaryRepository {
    private offlineAdapter = new SummaryOfflineAdapter();

    async getSummary(structureId: string | number, date?: string): Promise<Result<FinancialSummary, Error>> {
        const targetDate = date || new Date().toISOString().split('T')[0];

        try {
            const isOnline = await isServerReachable();

            if (isOnline) {
                try {
                    log.debug('Fetching summary online', { structureId, targetDate });
                    const summary = await FinancialSummaryApi.getSummary(structureId, targetDate);

                    log.info('Summary API Response received', {
                        structureId,
                        hasData: !!summary,
                        keys: summary ? Object.keys(summary) : [],
                        totalCollected: summary?.colectado_total
                    });

                    if (!date || date === new Date().toISOString().split('T')[0]) {
                        await this.cacheSummary(summary);
                    }

                    return ok({
                        totalCollected: summary.colectado_total || 0,
                        premiumsPaid: summary.pagado_total || 0,
                        netResult: summary.neto_total || 0,
                        draws: summary.sorteos || [],
                        timestamp: Date.now(),
                        date: targetDate,
                        id_estructura: Number(structureId),
                        nombre_estructura: 'Online',
                        padre_id: null,
                        colectado_total: summary.colectado_total || 0,
                        pagado_total: summary.pagado_total || 0,
                        neto_total: summary.neto_total || 0,
                        sorteos: summary.sorteos || []
                    });
                } catch (error) {
                    log.warn('Online fetch failed, falling back to cache', error);
                }
            }

            const cached = await this.getCachedSummary();
            if (cached) {
                log.info('Returning cached summary');
                return ok({
                    totalCollected: cached.colectado_total || 0,
                    premiumsPaid: cached.pagado_total || 0,
                    netResult: cached.neto_total || 0,
                    draws: cached.sorteos || [],
                    timestamp: cached.timestamp || Date.now(),
                    date: targetDate,
                    // Estos campos pueden faltar en caché antigua, los aseguramos
                    colectado_total: cached.colectado_total || cached.totalCollected || 0,
                    pagado_total: cached.pagado_total || cached.premiumsPaid || 0,
                    neto_total: cached.neto_total || cached.netResult || 0,
                    sorteos: cached.sorteos || cached.draws || []
                } as FinancialSummary);
            }

            // Unify behavior with DrawRepository: Return empty/default state instead of error
            // This prevents UI error screens when API fails but we want to show the interface
            log.warn('No summary available (Online failed + No cache). Returning empty state.');
            return ok({
                totalCollected: 0,
                premiumsPaid: 0,
                netResult: 0,
                draws: [],
                timestamp: Date.now(),
                date: targetDate,
                // Add dummy fields to satisfy FinancialSummary interface if strict check is failing elsewhere
                id_estructura: Number(structureId),
                nombre_estructura: 'Offline',
                padre_id: null,
                colectado_total: 0,
                pagado_total: 0,
                neto_total: 0,
                sorteos: []
            });

        } catch (error: any) {
            log.error('Error getting summary', error);
            return err(error);
        }
    }

    private async cacheSummary(summary: any): Promise<void> {
        await this.offlineAdapter.saveSummary(summary);
    }

    private async getCachedSummary(): Promise<FinancialSummary | null> {
        return await this.offlineAdapter.getSummary();
    }
}

export const summaryRepository = new OfflineFirstSummaryRepository();
