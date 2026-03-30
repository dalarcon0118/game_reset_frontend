import { BetType } from '@/types';
import { BackendBet, ListBetsFilters } from './types';
import { BetDomainModel } from '../../repositories/bet/bet.types';
import { toUtcISODate } from '@/shared/utils/formatters';
import { logger } from '@/shared/utils/logger';
import { BetTypeKind, normalizeBetType, normalizeNumbers } from '@/shared/types/bet_types';
import { GameType } from '@/types';

const log = logger.withTag('BET_MAPPER');

/**
 * Mapea un betTypeId del backend al tipo normalizado.
 * Usa el mapeo centralizado.
 */
const mapBackendBetType = (backendBet: BackendBet, betTypes: GameType[] = []): BetTypeKind => {
    const detailsCode = backendBet.bet_type_details?.code;
    if (detailsCode) {
        return normalizeBetType(detailsCode);
    }

    const betTypeRaw = backendBet.bet_type?.toString() || '';
    const betTypeFromCacheById = betTypes.find(t => t.id?.toString() === betTypeRaw);
    if (betTypeFromCacheById) {
        return normalizeBetType(betTypeFromCacheById.code || betTypeFromCacheById.name);
    }

    const betTypeFromCacheByCode = betTypes.find(
        t => (t.code || '').toUpperCase() === betTypeRaw.toUpperCase()
    );
    if (betTypeFromCacheByCode) {
        return normalizeBetType(betTypeFromCacheByCode.code || betTypeFromCacheByCode.name);
    }

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
            betTypeId: backendBet.bet_type_details?.code || (backendBet.bet_type ?? ''),
            betTypeCode: backendBet.bet_type_details?.code || '',
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
            ? toUtcISODate(Number(filters.date))
            : filters.date;

        log.info('Filtering pending bets by date', {
            originalFilter: filters.date,
            normalizedFilter: filterDate,
            totalPending: relevantPendingBets.length
        });

        relevantPendingBets = relevantPendingBets.filter((pb: BetDomainModel) => {
            const betDate = toUtcISODate(pb.timestamp);
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
            externalId: pb.externalId || '',
            type: normalizedType,
            numbers: normalizedNumbers,
            amount: Number(pb.amount || 0),
            drawId: String(pb.drawId || ''),
            createdAt: new Date(pb.timestamp).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            timestamp: pb.timestamp,
            isPending: pb.status !== 'synced',
            receiptCode: pb.receiptCode,
            betTypeId: pb.betTypeCode || pb.betTypeId,
            betTypeCode: pb.betTypeCode,
            status: pb.status || 'pending'
        };
    }

    // Fallback: intentar inferir desde betTypeId
    const betTypeRef = String(pb.betTypeCode || pb.betTypeId || '');
    const betTypeFromCache = betTypes.find(
        t =>
            t.id?.toString() === betTypeRef ||
            (t.code || '').toUpperCase() === betTypeRef.toUpperCase()
    );

    let mappedType: BetTypeKind = 'Fijo';
    if (betTypeFromCache) {
        mappedType = normalizeBetType(betTypeFromCache.code || betTypeFromCache.name);
    }

    return {
        id: `offline-${pb.externalId}`,
        externalId: pb.externalId || '',
        type: mappedType,
        numbers: normalizeNumbers(pb.numbers),
        amount: Number(pb.amount || 0),
        drawId: String(pb.drawId || ''),
        createdAt: new Date(pb.timestamp).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        }),
        timestamp: pb.timestamp,
        isPending: pb.status !== 'synced',
        receiptCode: pb.receiptCode,
        betTypeId: pb.betTypeCode || pb.betTypeId,
        betTypeCode: pb.betTypeCode,
        status: pb.status || 'pending'
    };
};
