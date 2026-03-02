import { match } from 'ts-pattern';
import { Cmd } from '@/shared/core/cmd';
import { RemoteDataHttp } from '@/shared/core/remote.data.http';
import { drawRepository } from '@/shared/repositories/draw';
import { betRepository } from '@/shared/repositories/bet/bet.repository';
import { financialRepository, summaryRepository } from '@/shared/repositories/financial';
import apiClient from '@/shared/services/api_client';
import { FinancialSummary, DrawType, BetType } from '@/types';
import { logger } from '@/shared/utils/logger';


import {
    PENDING_BETS_LOADED,
    DRAWS_RECEIVED,
    SUMMARY_RECEIVED,
    AUTH_TOKEN_UPDATED,
    NONE
} from './msg';

const log = logger.withTag('DASHBOARD_COMMANDS');

const ensureError = (error: any): Error => {
    if (error instanceof Error) return error;
    let message = String(error);
    if (typeof error === 'object' && error !== null) {
        if ('message' in error && typeof (error as any).message === 'string') message = (error as any).message;
        else if ('detail' in error && typeof (error as any).detail === 'string') message = (error as any).detail;
        else {
            try {
                const json = JSON.stringify(error);
                if (json !== '{}') message = json;
                else if (message === '[object Object]') message = 'Unknown error';
            } catch { }
        }
    }
    return new Error(message);
};

export const fetchDrawsCmd = (structureId: string | null): Cmd => {
    if (!structureId || structureId === '0') return Cmd.none;
    log.debug('Requesting draws for structure', { structureId });

    return Cmd.task({
        task: async () => {
            try {
                log.info('Calling drawRepository.getDraws...');
                const result = await drawRepository.getDraws({ owner_structure: structureId, today: true });
                log.info('drawRepository.getDraws result', { isOk: result.isOk() });

                if (result.isOk()) {
                    log.info('Draws fetched successfully', { count: result.value.length });
                    return result.value;
                }
                log.warn('Draws fetch failed', result.error);
                throw result.error;
            } catch (e) {
                log.error('Unexpected error in fetchDrawsCmd task', e);
                throw e;
            }
        },
        onSuccess: (data) => {
            log.info('Dispatching DRAWS_RECEIVED Success');
            return DRAWS_RECEIVED({ type: 'Success', data });
        },
        onFailure: (error) => {
            log.warn('Dispatching DRAWS_RECEIVED Failure', error);
            return DRAWS_RECEIVED({ type: 'Failure', error: ensureError(error) });
        }
    });
};

export const fetchSummaryCmd = (structureId: string | null): Cmd => {
    if (!structureId || structureId === '0') return Cmd.none;

    log.debug('Starting fetchSummaryCmd', { structureId });

    return Cmd.task({
        task: async () => {
            // Usar summaryRepository para obtener datos con desglose por sorteo
            log.debug('fetchSummaryCmd: Calling summaryRepository.getSummary', { structureId });
            const summaryResult = await summaryRepository.getSummary(structureId);

            if (summaryResult.isErr()) {
                log.error('fetchSummaryCmd: Error getting summary', summaryResult.error);
                throw summaryResult.error;
            }

            const summary = summaryResult.value;

            log.info('fetchSummaryCmd result', {
                hasData: summary.colectado_total > 0 || summary.sorteos?.length > 0,
                totalCollected: summary.totalCollected,
                premiumsPaid: summary.premiumsPaid,
                netResult: summary.netResult,
                sorteosCount: summary.sorteos?.length || 0,
                sorteosSample: summary.sorteos?.[0]
            });

            // Devolver el summary completo que incluye los datos por sorteo
            return summary;
        },
        onSuccess: (data) => {
            log.info('Dispatching SUMMARY_RECEIVED Success');
            return SUMMARY_RECEIVED({ type: 'Success', data });
        },
        onFailure: (error) => {
            log.warn('Dispatching SUMMARY_RECEIVED Failure', error);
            return SUMMARY_RECEIVED({ type: 'Failure', error: ensureError(error) });
        },
        label: 'FETCH_SUMMARY'
    });
};


export const loadPendingBetsCmd = (): Cmd => {
    return Cmd.task({
        task: async () => {
            try {
                const result = await betRepository.getBets();
                if (result.isErr()) throw result.error;

                const allBets = result.value;
                const pending = allBets.filter((b: BetType) => b.isPending);
                const synced = allBets.filter((b: BetType) => !b.isPending);

                log.info('Loaded dashboard bets', {
                    total: allBets.length,
                    pending: pending.length,
                    synced: synced.length
                });

                return { pending, synced };
            } catch (error) {
                log.error('Error loading pending bets', error);
                throw error;
            }
        },
        onSuccess: (data) => PENDING_BETS_LOADED(data),
        onFailure: (error) => NONE() // Silent failure for offline bets
    });
};

export const updateAuthTokenCmd = (): Cmd => {
    return Cmd.task({
        task: async () => {
            const token = await apiClient.getAuthToken();
            return token || '';
        },
        onSuccess: (token) => AUTH_TOKEN_UPDATED(token),
        onFailure: () => NONE()
    });
};
