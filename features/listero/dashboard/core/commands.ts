import { match } from 'ts-pattern';
import { Cmd } from '@/shared/core/cmd';
import { RemoteData } from '@/shared/core/remote.data';
import { RemoteDataHttp } from '@/shared/core/remote.data.http';
import { DrawService } from '@/shared/services/draw';
import { FinancialSummaryService } from '@/shared/services/financial_summary';
import { OfflineStorage, PendingBet } from '@/shared/services/offline_storage';
import apiClient from '@/shared/services/api_client';
import { FinancialSummary, DrawType } from '@/types';
import { logger } from '@/shared/utils/logger';

import {
    PENDING_BETS_LOADED,
    DRAWS_RECEIVED,
    SUMMARY_RECEIVED,
    AUTH_TOKEN_UPDATED,
    NONE
} from './msg';

const log = logger.withTag('DASHBOARD_COMMANDS');

export const fetchDrawsCmd = (structureId: string | null): Cmd => {
    if (!structureId || structureId === '0') return Cmd.none;
    log.debug('Requesting draws for structure', { structureId });
    return RemoteDataHttp.fetch<DrawType[], any>(
        async () => {
            try {
                // Fix: DrawService.list returns Promise<ExtendedDrawType[]>, not [error, data]
                // Also pass structure_id as query param object, not raw number
                // Use owner_structure as per backend requirement (DrawViewSet)
                const draws = await DrawService.list({ owner_structure: structureId, next24h: true });

                if (!draws) {
                    log.warn('Received null/undefined draws, returning empty array');
                    return [];
                }

                return draws;
            } catch (error) {
                log.error('Error fetching draws', error);
                throw error;
            }
        },
        (webData) => {
            log.debug('Received draws webData', { type: webData.type });
            return DRAWS_RECEIVED(webData);
        },
        'FETCH_DRAWS'
    );
};

export const loadPendingBetsCmd = (): Cmd => {
    return Cmd.task({
        task: async () => {
            try {
                // Maintenance: Prune stale bets (> 48h) to prevent storage clutter
                await OfflineStorage.pruneStalePendingBets();

                // 1. Obtener apuestas del sistema legacy (V1)
                const legacyPending = await OfflineStorage.getPendingBets();
                // 2. Obtener todas las apuestas del día (incluidas sincronizadas)
                const allLegacy = await OfflineStorage.getAllDailyBets?.() || [];

                // 3. Obtener apuestas del nuevo sistema (V2)
                const { OfflineFinancialService } = require('@/shared/services/offline');
                const v2Pending = await OfflineFinancialService.getPendingBets();

                // Combinar pendientes
                const combinedPending = [...legacyPending];
                v2Pending.forEach((v2Bet: any) => {
                    const exists = combinedPending.some(b => b.offlineId === v2Bet.offlineId);
                    if (!exists) combinedPending.push(v2Bet);
                });

                // Separar sincronizadas (aquellas que están en allLegacy pero no en legacyPending)
                const syncedBets = allLegacy.filter(b => b.status === 'synced');

                log.info('Loaded dashboard bets', {
                    pending: combinedPending.length,
                    synced: syncedBets.length
                });

                return { pending: combinedPending, synced: syncedBets };
            } catch (error) {
                log.error('Error loading bets', error);
                return { pending: [], synced: [] };
            }
        },
        onSuccess: (data) => PENDING_BETS_LOADED(data.pending, data.synced),
        onFailure: () => PENDING_BETS_LOADED([], [])
    });
};

export const updateAuthTokenCmd = (): Cmd => {
    return RemoteDataHttp.fetch(
        () => apiClient.getAuthToken(),
        (webData) => {
            if (webData.type === 'Success' && webData.data) {
                return AUTH_TOKEN_UPDATED(webData.data);
            }
            return NONE();
        }
    );
};

export const fetchSummaryCmd = (structureId: string | null): Cmd => {
    if (!structureId || structureId === '0') return Cmd.none;
    log.debug('Requesting financial summary for structure', { structureId });
    return RemoteDataHttp.fetch<FinancialSummary, any>(
        async () => {
            const [error, data] = await FinancialSummaryService.get(structureId);
            if (error) throw error;
            if (!data) throw new Error('No summary received');
            return data;
        },
        (webData) => {
            log.debug('Received summary webData', { type: webData.type });
            return SUMMARY_RECEIVED(webData);
        }
    );
};
