import { Cmd } from '@core/tea-utils';
import { drawRepository } from '@/shared/repositories/draw';
import { betRepository } from '@/shared/repositories/bet/bet.repository';
import { AuthRepository } from '@/shared/repositories/auth';
import { TimerRepository } from '@/shared/repositories/system/time/tea.repository';
import { TimePolicy } from '@/shared/repositories/system/time/time.update';
import apiClient from '@/shared/services/api_client';
import { BetType } from '@/types';
import { logger } from '@/shared/utils/logger';
import { ensureError } from '@/shared/utils/error';
import { withTimeout } from '@/shared/utils/timeout';

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
            log.info('[FLOW] Fetching user data for dashboard initialization...');
            const user = await AuthRepository.hydrate();

            if (!user) {
                log.warn('[FLOW] No user found during hydration');
                return null;
            }

            log.info('[FLOW] User data hydrated successfully', { userId: user.id, structure: (user as any).structure });
            return adaptAuthUser(user);
        },
        onSuccess: (user) => {
            log.info('[FLOW] AUTH_USER_SYNCED dispatched', { hasUser: !!user });
            return AUTH_USER_SYNCED(user);
        },
        onFailure: (error) => {
            log.error('[FLOW] Failed to fetch user data', error);
            return AUTH_USER_SYNCED(null);
        }
    });
};

export const fetchDrawsCmd = (structureId: string | null, commissionRate: number = 0, forceSync = false): Cmd => {
    if (structureId === '0') {
        log.warn('[FLOW] Invalid structureId "0", skipping draw fetch');
        return Cmd.none;
    }

    return Cmd.task({
        task: async () => {
            log.info('[FLOW] Fetching draws', { structureId, commissionRate, forceSync });
            
            // Log the input parameters clearly
            log.info('[FETCH_DRAWS] Starting fetchDrawsCmd task', { 
                structureId, 
                structureIdType: typeof structureId,
                commissionRate, 
                forceSync 
            });
            
            const result = await withTimeout(
                drawRepository.getDraws({
                    owner_structure: structureId,
                    today: true,
                    forceSync,
                    commissionRate
                }),
                10000,
                'fetchDraws'
            );

            log.info('[FETCH_DRAWS] withTimeout result', { 
                resultType: typeof result, 
                isOk: result?.isOk?.(),
                isErr: result?.isErr?.(),
                error: result?.isErr?.() ? result.error : null
            });

            if (!result.isOk()) {
                log.error('[FLOW] Error from draw repository', result.error);
                throw result.error;
            }

            const draws = result.value;
            if (!Array.isArray(draws)) {
                log.error('[FLOW] drawRepository.getDraws() did not return an array', { value: draws });
                throw new Error('Invalid draws data: expected array');
            }
            const relevantDraws = draws.filter((draw: any) => {
                const status = draw.status?.toLowerCase();
                return status === 'open' || status === 'scheduled' || status === 'pending';
            });

            log.info(`[FLOW] Draws processed: ${draws.length} total → ${relevantDraws.length} relevant`);
            return relevantDraws;
        },
        onSuccess: (data) => {
            log.info(`[FETCH_DRAWS] onSuccess handler - DRAWS_RECEIVED`, { 
                drawsCount: data?.length,
                drawsSample: data?.length > 0 ? data.slice(0, 2) : null
            });
            return DRAWS_RECEIVED({ type: 'Success', data });
        },
        onFailure: (error) => {
            log.error('[FETCH_DRAWS] onFailure handler - DRAWS_RECEIVED failed', { 
                error: error?.message, 
                stack: error?.stack?.split('\n').slice(0, 5).join('\n')
            });
            return DRAWS_RECEIVED({ type: 'Failure', error: ensureError(error) });
        }
    });
};

export const loadPendingBetsCmd = (): Cmd => {
    return Cmd.task({
        task: async () => {
            log.info('[FLOW] loadPendingBetsCmd: Starting...');

            // SSOT: Solo pedimos las apuestas de hoy para el dashboard.
            // Las pendientes offline siempre se incluyen localmente por el repositorio.
            // Usamos tiempo confiable del servidor y TimePolicy.getTodayStart() como SSOT.
            const trustedNow = TimerRepository.getTrustedNow(Date.now());
            const todayStart = TimePolicy.getTodayStart(trustedNow);
            const today = TimePolicy.formatLocalDate(new Date(todayStart));

            log.info('[FLOW] loadPendingBetsCmd: Requesting bets', {
                trustedNow,
                trustedNowLocal: new Date(trustedNow).toLocaleString(),
                todayStart,
                todayStartLocal: new Date(todayStart).toLocaleString(),
                today
            });

            log.info('[FLOW] loadPendingBetsCmd: Requesting bets', {
                trustedNow,
                trustedNowLocal: new Date(trustedNow).toLocaleString(),
                todayStart,
                todayStartLocal: new Date(todayStart).toLocaleString(),
                today
            });

            const betsPromise = betRepository.getBets({ date: today });
            const result = await withTimeout(betsPromise, 10000, 'loadPendingBets');
            if (result.isErr()) {
                log.error('[FLOW] loadPendingBetsCmd: Failed to load bets', result.error);
                throw result.error;
            }

            const allBets = result.value;
            log.info(`[FLOW] loadPendingBetsCmd: Retrieved ${allBets.length} total bets from repository`);

            const pending = allBets.filter((b: BetType) => b.isPending);
            const synced = allBets.filter((b: BetType) => !b.isPending);

            log.info('[FLOW] loadPendingBetsCmd: Split results', {
                total: allBets.length,
                pending: pending.length,
                synced: synced.length,
                pendingSample: pending.length > 0 ? pending.slice(0, 3).map(b => ({
                    id: b.id || b.externalId,
                    timestamp: b.timestamp,
                    timestampLocal: new Date(b.timestamp).toLocaleString(),
                    amount: b.amount,
                    status: b.status
                })) : []
            });

            return { pending, synced };
        },
        onSuccess: (data) => {
            log.info(`[FLOW] loadPendingBetsCmd: PENDING_BETS_LOADED dispatched (${data.pending.length} pending, ${data.synced.length} synced)`);
            return PENDING_BETS_LOADED(data.pending, data.synced);
        },
        onFailure: (error) => {
            log.error('[FLOW] loadPendingBetsCmd: Failed', error);
            return PENDING_BETS_LOADED([], []);
        }
    });
};

export const updateAuthTokenCmd = (): Cmd => {
    return Cmd.task({
        task: async () => {
            log.info('[FLOW] Updating auth token...');
            const token = await apiClient.getAuthToken();
            if (!token) throw new Error('Token not available yet');
            log.info('[FLOW] Auth token updated successfully');
            return token;
        },
        onSuccess: (token) => {
            log.info('[FLOW] AUTH_TOKEN_UPDATED dispatched');
            return ({ type: 'AUTH_TOKEN_UPDATED', token });
        },
        onFailure: (error) => {
            log.warn('[FLOW] Could not update auth token - keeping existing', error);
            return { type: 'NONE' };
        }
    });
};
