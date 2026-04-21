/**
 * Repository para obtener los winning records del banco
 * 
 * DDD Principle: Este repository conoce la estructura del usuario a través de AuthRepository.
 * Si no se pasa structureId, lo resuelve internamente desde el perfil offline.
 */
import apiClient from '@/shared/services/api_client';
import settings from '@/config/settings';
import { logger } from '@/shared/utils/logger';
import { AuthRepository } from '@/shared/repositories/auth';

const log = logger.withTag('WINNING_RECORDS_REPOSITORY');

export interface WinningRecordEntry {
    id: number;
    date: string;
    bet_type_code: string;
    winning_number: string;
    created_at: string;
    updated_at: string;
    real_winners_count?: number;
}

export interface WinningRecordsResponse {
    count: number;
    bank_id: number;
    bank_name: string;
    configured_bet_types: string[];
    start_date: string;
    end_date: string;
    days: number;
    results: WinningRecordEntry[];
}

export interface BankConfig {
    bankId: number;
    bankName: string;
    configuredBetTypes: string[];
}

export interface IWinningRecordsRepository {
    getAllWinnersByBank(bankId: number, days?: number): Promise<WinningRecordEntry[]>;
    getWinnersByStructure(structureId?: string, days?: number): Promise<WinningRecordEntry[]>;
}

/**
 * Obtiene el structureId del usuario para winning records.
 * DDD: El repository obtiene la estructura desde el perfil offline.
 * El backend resolverá el banco padre si es necesario.
 */
async function getUserStructureId(): Promise<number | null> {
    try {
        const user = await AuthRepository.getOfflineProfile();
        if (user?.structure?.id) {
            const structureId = Number(user.structure.id);
            log.debug('Using structure for winning records', { structureId });
            return structureId;
        }
        log.warn('No structure found in user profile');
        return null;
    } catch (error) {
        log.error('Failed to get user structure', error);
        return null;
    }
}

export class WinningRecordsApiRepository implements IWinningRecordsRepository {
    /**
     * Obtiene todos los números winners de un banco específico.
     * @param bankId - ID del banco
     * @param days - Número de días hacia atrás (default: 30)
     * @param forceRefresh - Forzar recarga desde el backend
     */
    async getAllWinnersByBank(bankId: number, days: number = 30, forceRefresh: boolean = false): Promise<WinningRecordEntry[]> {
        try {
            log.debug('Fetching all winners by bank', { bankId, days, forceRefresh });
            
            const params = { days };
            const results = await apiClient.get<WinningRecordEntry[]>(
                `/draw/winning-records/by-bank/${bankId}/`,
                { queryParams: params, skipCache: forceRefresh }
            );
            
            log.debug('Winning records fetched', { 
                count: Array.isArray(results) ? results.length : 0, 
                bankId,
                days,
                isArray: Array.isArray(results)
            });
            
            return results || [];
        } catch (error) {
            log.error('Failed to fetch winning records', { error, bankId, days });
            throw error;
        }
    }

    /**
     * Obtiene todos los números winners de una estructura específica.
     * 
     * DDD: Si no se pasa structureId, obtiene la estructura del usuario
     * desde AuthRepository (Single Source of Truth)
     * 
     * @param structureId - ID de la estructura (opcional)
     * @param days - Número de días hacia atrás (default: 30)
     */
    async getWinnersByStructure(structureId?: string, days: number = 30): Promise<WinningRecordEntry[]> {
        try {
            // DDD: Resolver structureId si no se provee
            const structureIdNum = structureId ? Number(structureId) : await getUserStructureId();
            
            if (!structureIdNum) {
                log.warn('Cannot fetch winning records: no structureId available');
                return [];
            }
            
            const resolvedId = String(structureIdNum);
            
            log.debug('Fetching all winners by structure', { structureId: resolvedId, days });
            
            const params = { days };
            const results = await apiClient.get<WinningRecordEntry[]>(
                `/draw/winning-records/by-structure/${resolvedId}/`,
                { queryParams: params }
            );
            
            log.debug('Winning records fetched by structure', { 
                count: Array.isArray(results) ? results.length : 0, 
                structureId: resolvedId,
                days
            });
            
            return results || [];
        } catch (error) {
            log.error('Failed to fetch winning records by structure', { error, structureId, days });
            throw error;
        }
    }
}

// Singleton instance
export const winningRecordsRepository = new WinningRecordsApiRepository();