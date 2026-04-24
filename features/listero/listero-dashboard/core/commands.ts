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

const withTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
        )
    ]);
};

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

export const fetchDrawsCmd = (structureId: string | null, commissionRate: number = 0, forceSync = false): Cmd => {
    // Si no se proporciona structureId, DrawRepository.getDraws() lo obtendrá automáticamente del AuthRepository
    // Solo verificamos si esavelmente '0' (inválido)
    if (structureId === '0') {
        return Cmd.none;
    }

    return Cmd.task({
        task: async () => {
            try {
                const fetchPromise = drawRepository.getDraws({ 
                    owner_structure: structureId, 
                    today: true, 
                    forceSync,
                    commissionRate // Pass commissionRate for enrichment
                });
                const result = await withTimeout(fetchPromise, 10000, 'fetchDraws');

                if (result.isOk()) {
                    return result.value;
                }
                throw result.error;
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                log.warn('Error fetching draws, evaluating fallback', { errorMessage });

                // Evaluamos si es un error de red o falta de caché
                const isOfflineError = 
                    errorMessage.includes('No internet connection') || 
                    errorMessage.includes('Offline') ||
                    errorMessage.includes('timed out') ||
                    errorMessage.includes('Network Error');

                if (isOfflineError) {
                    // CORRECCIÓN: Intentar obtener del cache offline antes de retornar vacío
                    log.warn('>>> CACHE FALLBACK: Attempting offline cache for draws...');
                    try {
                        const cachedDraws = await drawRepository.getDraws({ owner_structure: structureId });
                        log.warn('>>> CACHE FALLBACK: Raw cached draws:', cachedDraws.isOk(), cachedDraws.value?.length);
                        
                        if (cachedDraws.isOk() && cachedDraws.value && cachedDraws.value.length > 0) {
                            // FILTRAR: Solo sorteos abiertos o pendientes (no cerrados con premios)
                            const relevantDraws = cachedDraws.value.filter((draw: any) => {
                                const status = draw.status?.toLowerCase();
                                return status === 'open' || status === 'scheduled' || status === 'pending';
                            });
                            
                            log.warn('>>> CACHE FALLBACK: Filtered %d -> %d (open/scheduled/pending)', 
                                cachedDraws.value.length, relevantDraws.length);
                            
                            // Si no hay sorteos relevantes, retornar vacío (no mostrar históricos)
                            if (relevantDraws.length === 0) {
                                log.warn('>>> CACHE FALLBACK: No relevant draws (all closed), returning empty');
                                return [];
                            }
                            
                            return relevantDraws;
                        }
                    } catch (cacheError) {
                        log.error('>>> CACHE FALLBACK: ERROR reading cache:', cacheError);
                    }
                    
                    log.warn('>>> CACHE FALLBACK: No cached draws, returning empty list');
                    return [];
                }
                
                log.error('Unexpected error in fetchDrawsCmd task', e);
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
            // SSoT: Solo pedimos las apuestas de hoy para el dashboard.
            // Las pendientes offline siempre se incluyen localmente por el repositorio.
            const today = new Date().toISOString().split('T')[0];
            const betsPromise = betRepository.getBets({ date: today });
            const result = await withTimeout(betsPromise, 10000, 'loadPendingBets');
            if (result.isErr()) throw result.error;

            const allBets = result.value;
            const pending = allBets.filter((b: BetType) => b.isPending);
            const synced = allBets.filter((b: BetType) => !b.isPending);

            return { pending, synced };
        },
        onSuccess: (data) => PENDING_BETS_LOADED(data.pending, data.synced),
        onFailure: (error) => {
            log.error('Failed to load pending bets', error);
            // Return empty data so dashboard can still function
            return PENDING_BETS_LOADED([], []);
        }
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
