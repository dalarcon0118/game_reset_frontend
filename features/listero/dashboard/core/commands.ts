import { match } from 'ts-pattern';
import { Cmd } from '@/shared/core/cmd';
import { RemoteData } from '@/shared/core/remote.data';
import { RemoteDataHttp } from '@/shared/core/remote.data.http';
import { DrawService } from '@/shared/services/draw';
import { FinancialSummaryService } from '@/shared/services/financial_summary';
import { OfflineStorage, PendingBet } from '@/shared/services/offline_storage';
import apiClient from '@/shared/services/api_client';
import { FinancialSummary, DrawType } from '@/types';
import {
    PENDING_BETS_LOADED,
    DRAWS_RECEIVED,
    SUMMARY_RECEIVED,
    AUTH_TOKEN_UPDATED,
    NONE
} from './msg';

export const fetchDrawsCmd = (structureId: string | null): Cmd => {
    if (!structureId || structureId === '0') return Cmd.none;
    console.log('fetchDrawsCmd: Requesting draws for structure', structureId);
    return RemoteDataHttp.fetch<DrawType[], any>(
        async () => {
            try {
                // Fix: DrawService.list returns Promise<ExtendedDrawType[]>, not [error, data]
                // Also pass structure_id as query param object, not raw number
                // Use owner_structure as per backend requirement (DrawViewSet)
                const draws = await DrawService.list({ owner_structure: structureId, next24h: true });

                if (!draws) {
                    console.warn('fetchDrawsCmd: Received null/undefined draws, returning empty array');
                    return [];
                }

                return draws;
            } catch (error) {
                console.error('fetchDrawsCmd: Error fetching draws', error);
                throw error;
            }
        },
        (webData) => {
            console.log('fetchDrawsCmd: Received DRAWS_RECEIVED', webData.type);
            return DRAWS_RECEIVED(webData);
        }
    );
};

export const loadPendingBetsCmd = (): Cmd => {
    return RemoteDataHttp.fetch<PendingBet[], any>(
        async () => {
            // Maintenance: Prune stale bets (> 48h) to prevent storage clutter
            await OfflineStorage.pruneStalePendingBets();
            return await OfflineStorage.getPendingBets();
        },
        (webData) => {
            return match(webData)
                .with(RemoteData.Success, ({ data }) => PENDING_BETS_LOADED(data))
                .with(RemoteData.Failure, ({ error }) => {
                    console.error('Error loading pending bets:', error);
                    return PENDING_BETS_LOADED([]);
                })
                .otherwise(() => PENDING_BETS_LOADED([]));
        }
    );
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
    console.log('fetchSummaryCmd: Requesting financial summary for structure', structureId);
    return RemoteDataHttp.fetch<FinancialSummary, any>(
        async () => {
            const [error, data] = await FinancialSummaryService.get(structureId);
            if (error) throw error;
            if (!data) throw new Error('No summary received');
            return data;
        },
        (webData) => {
            console.log('fetchSummaryCmd: Received SUMMARY_RECEIVED', webData.type);
            return SUMMARY_RECEIVED(webData);
        }
    );
};
