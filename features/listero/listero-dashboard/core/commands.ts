import { Cmd } from '@core/tea-utils';
import { drawRepository } from '@/shared/repositories/draw';
import { betRepository } from '@/shared/repositories/bet/bet.repository';
import { AuthRepository } from '@/shared/repositories/auth';
import apiClient from '@/shared/services/api_client';
import { BetType } from '@/types';
import { logger } from '@/shared/utils/logger';
import { ensureError } from '@/shared/utils/error';

import {
    PENDING_BETS_LOADED,
    DRAWS_RECEIVED,
    AUTH_TOKEN_UPDATED,
    AUTH_USER_SYNCED,
    NONE
} from './msg';
import { DashboardUser, adaptAuthUser } from './user.dto';

const log = logger.withTag('DASHBOARD_COMMANDS');

export const fetchUserDataCmd = (): Cmd => {
    return Cmd.task({
        task: async (): Promise<DashboardUser | null> => {
            log.info('Fetching user data for dashboard initialization...');
            const user = await AuthRepository.hydrate();

            if (!user) return null;

            return adaptAuthUser(user);
        },
        onSuccess: (user) => AUTH_USER_SYNCED(user),
        onFailure: (error) => {
            log.error('Failed to fetch user data', error);
            return AUTH_USER_SYNCED(null);
        }
    });
};

export const fetchDrawsCmd = (structureId: string | null): Cmd => {
    if (!structureId || structureId === '0') {
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
