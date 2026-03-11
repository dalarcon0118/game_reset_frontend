import { Cmd } from '@/shared/core/tea-utils';
import { drawRepository } from '@/shared/repositories/draw';
import { betRepository } from '@/shared/repositories/bet/bet.repository';
import apiClient from '@/shared/services/api_client';
import { BetType } from '@/types';
import { logger } from '@/shared/utils/logger';
import { ensureError } from '@/shared/utils/error';

import {
    PENDING_BETS_LOADED,
    DRAWS_RECEIVED,
    AUTH_TOKEN_UPDATED,
    DAILY_SESSION_PREPARED,
    NONE
} from './msg';
import { prepareDailySessionUseCase } from './use-cases/prepare-daily-session.use-case';

const log = logger.withTag('DASHBOARD_COMMANDS');

export const prepareDailySessionCmd = (): Cmd => {
    return Cmd.task({
        task: async () => {
            console.log('[DEBUG] prepareDailySessionCmd: INICIANDO...');
            const success = await prepareDailySessionUseCase();
            console.log('[DEBUG] prepareDailySessionCmd: resultado =', success);
            return success;
        },
        onSuccess: (success) => {
            return DAILY_SESSION_PREPARED({ success });
        },
        onFailure: (error) => {
            log.error('Unexpected error in prepareDailySessionCmd', error);
            // Even if it fails, we signal it's done so the dashboard can try to load
            return DAILY_SESSION_PREPARED({ success: false });
        }
    });
};

export const fetchDrawsCmd = (structureId: string | null): Cmd => {
    console.log('[DEBUG] fetchDrawsCmd: LLAMADO con structureId =', structureId, 'tipo:', typeof structureId);
    if (!structureId || structureId === '0') {
        console.log('[DEBUG] fetchDrawsCmd: RETORNANDO Cmd.none porque structureId es inválido');
        return Cmd.none;
    }

    return Cmd.task({
        task: async () => {
            try {
                const result = await drawRepository.getDraws({ owner_structure: structureId, today: true });

                if (result.isOk()) {
                    return result.value;
                }
                throw result.error;
            } catch (e) {
                // This is an expected error case when offline with no cache
                const errorMessage = e instanceof Error ? e.message : String(e);
                if (errorMessage.includes('No internet connection and no cached draws available')) {
                    log.warn('Offline mode: No internet connection and no cached draws available');
                    // Return empty array instead of throwing to avoid getting stuck in Loading
                    return [];
                } else {
                    log.error('Unexpected error in fetchDrawsCmd task', e);
                }
                throw e;
            }
        },
        onSuccess: (data) => {
            return DRAWS_RECEIVED({ type: 'Success', data });
        },
        onFailure: (error) => {
            return DRAWS_RECEIVED({ type: 'Failure', error: ensureError(error) });
        }
    });
};

export const loadPendingBetsCmd = (): Cmd => {
    return Cmd.task({
        task: async () => {
            const result = await betRepository.getBets();
            if (result.isErr()) throw result.error;

            const allBets = result.value;
            const pending = allBets.filter((b: BetType) => b.isPending);
            const synced = allBets.filter((b: BetType) => !b.isPending);

            return { pending, synced };
        },
        onSuccess: (data) => PENDING_BETS_LOADED(data),
        onFailure: () => NONE() // Silent failure for offline bets
    });
};

export const updateAuthTokenCmd = (): Cmd => {
    return Cmd.task({
        task: async () => {
            const token = await apiClient.getAuthToken();
            if (!token) throw new Error('Token not available yet');
            return token;
        },
        onSuccess: (token) => ({ type: 'AUTH_TOKEN_UPDATED', token }),
        onFailure: (error) => {
            log.warn('Could not update auth token - keeping existing', error);
            return { type: 'NONE' };
        }
    });
};
