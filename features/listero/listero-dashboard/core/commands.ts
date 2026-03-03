import { Cmd } from '@/shared/core/cmd';
import { drawRepository } from '@/shared/repositories/draw';
import { betRepository } from '@/shared/repositories/bet/bet.repository';
import { financialRepository, FinancialKeys } from '@/shared/repositories/financial';
import apiClient from '@/shared/services/api_client/api_client';
import { FinancialSummary, DrawType, BetType } from '@/types';
import { logger } from '@/shared/utils/logger';


import {
    PENDING_BETS_LOADED,
    DRAWS_RECEIVED,
    SUMMARY_RECEIVED,
    AUTH_TOKEN_UPDATED,
    DAILY_SESSION_PREPARED,
    NONE
} from './msg';
import { prepareDailySessionUseCase } from './use-cases/prepare-daily-session.use-case';

const log = logger.withTag('DASHBOARD_COMMANDS');

export const prepareDailySessionCmd = (): Cmd => {
    log.info('Preparing daily session (Cmd.task)...');
    return Cmd.task({
        task: async () => {
            const success = await prepareDailySessionUseCase();
            return success;
        },
        onSuccess: (success) => {
            log.info('Daily session preparation finished', { success });
            return DAILY_SESSION_PREPARED({ success });
        },
        onFailure: (error) => {
            log.error('Unexpected error in prepareDailySessionCmd', error);
            // Even if it fails, we signal it's done so the dashboard can try to load
            return DAILY_SESSION_PREPARED({ success: false });
        }
    });
};

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

    log.debug('Starting fetchSummaryCmd (Local SSOT)', { structureId });

    return Cmd.task({
        task: async () => {
            // SSOT: Usar financialRepository para obtener datos locales (lo que el listero ha hecho)
            const structureFilter = FinancialKeys.forStructure(structureId);
            const totalCollected = await financialRepository.getCredits(structureFilter);
            const premiumsPaid = await financialRepository.getDebits(structureFilter);

            // Obtener los sorteos actuales para el desglose
            const drawsResult = await drawRepository.getDraws({ owner_structure: structureId, today: true });
            const drawsInfo = drawsResult.isOk() ? drawsResult.value : [];

            // Construir el desglose por sorteo desde el Ledger local
            const sorteos = await Promise.all(drawsInfo.map(async (draw: DrawType) => {
                const drawFilter = FinancialKeys.forDraw(structureId, draw.id);
                const drawCollected = await financialRepository.getCredits(drawFilter);
                const drawPaid = await financialRepository.getDebits(drawFilter);

                return {
                    id: draw.id,
                    name: draw.name,
                    totalCollected: drawCollected,
                    premiumsPaid: drawPaid,
                    netResult: drawCollected - drawPaid,
                    status: draw.status
                };
            }));

            const summary: FinancialSummary = {
                totalCollected,
                premiumsPaid,
                netResult: totalCollected - premiumsPaid,
                draws: sorteos,
                timestamp: Date.now(),
                date: new Date().toISOString().split('T')[0],
                id_estructura: Number(structureId),
                nombre_estructura: 'Local (Offline)',
                colectado_total: totalCollected,
                pagado_total: premiumsPaid,
                neto_total: totalCollected - premiumsPaid,
                sorteos: sorteos
            };

            log.info('fetchSummaryCmd result (Local SSOT)', {
                totalCollected,
                premiumsPaid,
                sorteosCount: sorteos.length
            });

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
