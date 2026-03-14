import { BetType } from '@/types';
import { BackendBet, ListBetsFilters } from './types';
import { BetDomainModel } from '../../repositories/bet/bet.types';
import { logger } from '@/shared/utils/logger';
import { BET_TYPE_KEYS, BetTypeKind, normalizeBetType, normalizeNumbers, BET_TYPE_ID_MAP } from '@/shared/types/bet_types';
import { GameType } from '@/types';

import { TimerRepository } from '@/shared/repositories/system/time';

const log = logger.withTag('BET_MAPPER');

/**
 * Mapea un betTypeId del backend al tipo normalizado.
 * Usa el mapeo centralizado.
 */
const mapBackendBetType = (backendBet: BackendBet, betTypes: GameType[] = []): BetTypeKind => {
    // PRIORIDAD 1: Si hay cache de betTypes, usarlo
    const betTypeId = backendBet.bet_type?.toString();
    const betTypeFromCache = betTypes.find(t => t.id?.toString() === betTypeId);

    if (betTypeFromCache) {
        return normalizeBetType(betTypeFromCache.name);
    }

    // PRIORIDAD 2: Usar mapeo centralizado por ID
    if (betTypeId && BET_TYPE_ID_MAP[betTypeId]) {
        return BET_TYPE_ID_MAP[betTypeId];
    }

    // PRIORIDAD 3: Intentar desde bet_type_details
    const backendTypeName = backendBet.bet_type_details?.name || backendBet.game_type_details?.name || '';
    if (backendTypeName) {
        return normalizeBetType(backendTypeName);
    }

    return 'Fijo'; // Default
};

export const mapBackendBetToFrontend = (backendBet: BackendBet, betTypes: GameType[] = []): BetType => {
    try {
        log.debug('Mapping backend bet', { backendBet });

        // Usar mapeo centralizado
        const mappedType = mapBackendBetType(backendBet, betTypes);

        // Normalizar numbers usando función centralizada
        const cleanNumbers = normalizeNumbers(backendBet.numbers_played);

        log.debug(`Mapping bet result`, {
            id: backendBet.id,
            mappedType
        });

        return {
            id: (backendBet.id || backendBet.receipt_code || Math.random().toString(36).substring(7)).toString(),
            externalId: (backendBet.external_id as string) || backendBet.receipt_code || '',
            type: mappedType,
            numbers: cleanNumbers,
            amount: backendBet.amount ? parseFloat(backendBet.amount.toString()) : 0,
            drawId: backendBet.draw?.toString() || '',
            createdAt: backendBet.created_at ? new Date(backendBet.created_at).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            }) : new Date().toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            receiptCode: backendBet.receipt_code || '-----',
            timestamp: backendBet.created_at ? new Date(backendBet.created_at).getTime() : Date.now(),
            betTypeId: backendBet.bet_type ?? '',
            status: 'synced'
        };
    } catch (error) {
        log.error('Error mapping bet', error, { backendBet });
        throw error;
    }
};

export const mapPendingBetsToFrontend = (pendingBets: BetDomainModel[], filters?: ListBetsFilters, betTypes: GameType[] = []): BetType[] => {
    let relevantPendingBets = pendingBets;

    if (filters?.drawId) {
        relevantPendingBets = relevantPendingBets.filter((pb: BetDomainModel) => {
            const drawIdFromPb = pb.drawId.toString();
            const filterId = String(filters.drawId);
            return drawIdFromPb === filterId;
        });
    }

    if (filters?.date) {
        // Asegurar que el filtro sea un string ISO (YYYY-MM-DD) incluso si viene como timestamp
        const filterDate = typeof filters.date === 'number' || !isNaN(Number(filters.date))
            ? TimerRepository.formatUTCDate(Number(filters.date))
            : filters.date;

        log.info('Filtering pending bets by date', {
            originalFilter: filters.date,
            normalizedFilter: filterDate,
            totalPending: relevantPendingBets.length
        });

        relevantPendingBets = relevantPendingBets.filter((pb: BetDomainModel) => {
            const betDate = TimerRepository.formatUTCDate(pb.timestamp);
            const isMatch = betDate === filterDate;

            if (!isMatch) {
                log.debug('Pending bet excluded by date', {
                    receiptCode: pb.receiptCode,
                    betDate,
                    filterDate,
                    criteria: 'betDate === filterDate'
                });
            }

            return isMatch;
        });
    }

    if (filters?.receiptCode) {
        relevantPendingBets = relevantPendingBets.filter(pb => pb.receiptCode === filters.receiptCode);
    }

    const offlineBets: BetType[] = relevantPendingBets.map(pb => mapSinglePendingBetToFrontend(pb, betTypes));

    log.info('MAP_PENDING_BETS_RESULT', {
        inputCount: pendingBets.length,
        filteredCount: relevantPendingBets.length,
        outputCount: offlineBets.length
    });

    return offlineBets;
};

export const mapSinglePendingBetToFrontend = (pb: BetDomainModel, betTypes: GameType[] = []): BetType => {
    // Usar normalizeBetType para el campo type almacenado
    const storedType = pb.type;

    if (storedType) {
        const normalizedType = normalizeBetType(storedType);

        // Normalizar numbers usando función centralizada
        const normalizedNumbers = normalizeNumbers(pb.numbers);

        return {
            id: `offline-${pb.externalId}`,
            type: normalizedType,
            numbers: normalizedNumbers,
            amount: Number(pb.amount || 0),
            drawId: String(pb.drawId || ''),
            createdAt: new Date(pb.timestamp).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            timestamp: pb.timestamp,
            isPending: true,
            receiptCode: pb.receiptCode,
            betTypeId: pb.betTypeId
        };
    }

    // Fallback: intentar inferir desde betTypeId
    const betTypeId = String(pb.betTypeId || '');
    const betTypeFromCache = betTypes.find(t => t.id?.toString() === betTypeId);

    let mappedType: BetTypeKind = 'Fijo';
    if (betTypeFromCache) {
        mappedType = normalizeBetType(betTypeFromCache.name);
    }

    return {
        id: `offline-${pb.externalId}`,
        type: mappedType,
        numbers: normalizeNumbers(pb.numbers),
        amount: Number(pb.amount || 0),
        drawId: String(pb.drawId || ''),
        createdAt: new Date(pb.timestamp).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        }),
        timestamp: pb.timestamp,
        isPending: true,
        receiptCode: pb.receiptCode,
        betTypeId: pb.betTypeId
    };
};
