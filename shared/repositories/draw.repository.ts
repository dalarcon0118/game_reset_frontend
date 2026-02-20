import { ExtendedDrawType } from '@/shared/services/draw/types';
import { DrawApi } from '@/shared/services/draw/api';
import { mapBackendDrawToFrontend } from '@/shared/services/draw/mapper';
import storageClient from '@/shared/services/storage_client';
import { logger } from '@/shared/utils/logger';
import { Result, ok, err } from 'neverthrow';
import { isServerReachable } from '@/shared/utils/network';

const log = logger.withTag('DrawRepository');
const LAST_DRAWS_KEY = '@last_draws';

export interface IDrawRepository {
    getDraws(params?: Record<string, any>): Promise<Result<ExtendedDrawType[], Error>>;
    getDraw(id: string): Promise<Result<ExtendedDrawType, Error>>;
}

export class OfflineFirstDrawRepository implements IDrawRepository {

    async getDraws(params: Record<string, any> = {}): Promise<Result<ExtendedDrawType[], Error>> {
        try {
            log.debug('Getting draws', params);
            const isOnline = await isServerReachable();

            if (isOnline) {
                try {
                    const response = await DrawApi.list(params);
                    if (response && Array.isArray(response)) {
                        await this.cacheDraws(response);
                        return ok(response.map(mapBackendDrawToFrontend));
                    }
                } catch (error) {
                    log.warn('Online fetch failed, falling back to cache', error);
                }
            }

            const cachedDraws = await this.getCachedDraws();
            if (cachedDraws.length > 0) {
                log.info('Returning cached draws');
                return ok(cachedDraws.map(mapBackendDrawToFrontend));
            }

            if (!isOnline) {
                return err(new Error('No internet connection and no cached draws available'));
            }

            return ok([]);

        } catch (error: any) {
            log.error('Error getting draws', error);
            return err(error);
        }
    }

    async getDraw(id: string): Promise<Result<ExtendedDrawType, Error>> {
        try {
            const isOnline = await isServerReachable();

            if (isOnline) {
                try {
                    const response = await DrawApi.getOne(id);
                    if (response) {
                        return ok(mapBackendDrawToFrontend(response));
                    }
                } catch (error) {
                    log.warn('Online fetch failed, checking cache', error);
                }
            }

            const cachedDraws = await this.getCachedDraws();
            const found = cachedDraws.find((d: any) => String(d.id) === String(id));
            
            if (found) {
                return ok(mapBackendDrawToFrontend(found));
            }

            return err(new Error('Draw not found'));

        } catch (error: any) {
            log.error('Error getting draw', error);
            return err(error);
        }
    }

    private async cacheDraws(draws: any[]): Promise<void> {
        await storageClient.set(LAST_DRAWS_KEY, {
            data: draws,
            timestamp: Date.now()
        });
    }

    private async getCachedDraws(): Promise<any[]> {
        const parsed = await storageClient.get<{ data: any[], timestamp: number }>(LAST_DRAWS_KEY);
        if (!parsed) return [];

        const savedDate = new Date(parsed.timestamp);
        const currentDate = new Date();
        const isSameDay = savedDate.getDate() === currentDate.getDate() &&
            savedDate.getMonth() === currentDate.getMonth() &&
            savedDate.getFullYear() === currentDate.getFullYear();

        if (!isSameDay) {
            log.info('Draws cache expired (new day). Clearing.');
            await storageClient.remove(LAST_DRAWS_KEY);
            return [];
        }

        return parsed.data;
    }
}

export const DrawRepository = new OfflineFirstDrawRepository();
