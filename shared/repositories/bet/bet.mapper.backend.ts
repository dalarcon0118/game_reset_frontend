import { BetType } from '@/types';
import { BackendBet, ListBetsFilters, BetDomainModel } from './bet.types';
import { toUtcISODate } from '@/shared/utils/formatters';
import { logger } from '@/shared/utils/logger';
import { BetTypeKind, normalizeBetType, normalizeNumbers } from '@/shared/types/bet_types';
import { GameType } from '@/types';

const log = logger.withTag('BET_MAPPER');

const mapBackendBetType = (backendBet: BackendBet, betTypes: GameType[] = []): BetTypeKind => {
    const detailsCode = backendBet.bet_type_details?.code;
    if (detailsCode) return normalizeBetType(detailsCode);

    const betTypeRaw = backendBet.bet_type?.toString() || '';
    const betTypeFromCacheById = betTypes.find(t => t.id?.toString() === betTypeRaw);
    if (betTypeFromCacheById) return normalizeBetType(betTypeFromCacheById.code || betTypeFromCacheById.name);

    const betTypeFromCacheByCode = betTypes.find(
        t => (t.code || '').toUpperCase() === betTypeRaw.toUpperCase()
    );
    if (betTypeFromCacheByCode) return normalizeBetType(betTypeFromCacheByCode.code || betTypeFromCacheByCode.name);

    const backendTypeName = backendBet.bet_type_details?.name || backendBet.game_type_details?.name || '';
    if (backendTypeName) return normalizeBetType(backendTypeName);

    return 'Fijo';
};

export const mapBackendBetToFrontend = (backendBet: BackendBet, betTypes: GameType[] = []): BetType => {
    const mappedType = mapBackendBetType(backendBet, betTypes);
    const cleanNumbers = normalizeNumbers(backendBet.numbers_played);

    log.debug('Mapping backend bet', { id: backendBet.id, mappedType });

    return {
        id: (backendBet.id || backendBet.receipt_code || Math.random().toString(36).substring(7)).toString(),
        externalId: (backendBet.external_id as string) || backendBet.id?.toString() || backendBet.receipt_code || '',
        type: mappedType,
        numbers: cleanNumbers,
        amount: backendBet.amount ? parseFloat(backendBet.amount.toString()) : 0,
        drawId: backendBet.draw?.toString() || '',
        createdAt: backendBet.created_at
            ? new Date(backendBet.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
            : new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        receiptCode: backendBet.receipt_code || '-----',
        timestamp: backendBet.created_at ? new Date(backendBet.created_at).getTime() : Date.now(),
        betTypeId: backendBet.bet_type_details?.code || (backendBet.bet_type ?? ''),
        betTypeCode: backendBet.bet_type_details?.code || '',
        ownerStructure: backendBet.owner_structure,
        status: 'synced',
        fingerprint: backendBet.fingerprint_data ? {
            hash: backendBet.fingerprint_data.hash || '',
            version: backendBet.fingerprint_data.version || 1,
            chainHash: backendBet.fingerprint_data.chainHash || '',
            raw_payload: '' // El backend no suele devolver el raw_payload por tamaño
        } : undefined
    };
};

export const mapPendingBetsToFrontend = (pendingBets: BetDomainModel[], filters?: ListBetsFilters, betTypes: GameType[] = []): BetType[] => {
    let relevantPendingBets = pendingBets;

    if (filters?.drawId) {
        relevantPendingBets = relevantPendingBets.filter(
            pb => pb.drawId.toString() === String(filters.drawId)
        );
    }

    if (filters?.date) {
        const filterDate = typeof filters.date === 'number' || !isNaN(Number(filters.date))
            ? toUtcISODate(Number(filters.date))
            : filters.date;
        relevantPendingBets = relevantPendingBets.filter(
            pb => toUtcISODate(pb.timestamp) === filterDate
        );
    }

    if (filters?.receiptCode) {
        relevantPendingBets = relevantPendingBets.filter(pb => pb.receiptCode === filters.receiptCode);
    }

    return relevantPendingBets.map(pb => mapSinglePendingBetToFrontend(pb, betTypes));
};

export const mapSinglePendingBetToFrontend = (pb: BetDomainModel, betTypes: GameType[] = []): BetType => {
    const storedType = pb.type;

    if (storedType) {
        return {
            id: `offline-${pb.externalId}`,
            externalId: pb.externalId || '',
            type: normalizeBetType(storedType),
            numbers: normalizeNumbers(pb.numbers),
            amount: Number(pb.amount || 0),
            drawId: String(pb.drawId || ''),
            createdAt: new Date(pb.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            timestamp: pb.timestamp,
            isPending: pb.status !== 'synced',
            receiptCode: pb.receiptCode,
            betTypeId: pb.betTypeCode || pb.betTypeId,
            betTypeCode: pb.betTypeCode,
            ownerStructure: pb.ownerStructure,
            status: pb.status || 'pending',
            fingerprint: pb.fingerprint // FIX: Preservar fingerprint del dominio
        } as BetType & { fingerprint?: typeof pb.fingerprint };
    }

    const betTypeRef = String(pb.betTypeCode || pb.betTypeId || '');
    const betTypeFromCache = betTypes.find(
        t => t.id?.toString() === betTypeRef || (t.code || '').toUpperCase() === betTypeRef.toUpperCase()
    );

    let mappedType: BetTypeKind = 'Fijo';
    if (betTypeFromCache) mappedType = normalizeBetType(betTypeFromCache.code || betTypeFromCache.name);

    return {
        id: `offline-${pb.externalId}`,
        externalId: pb.externalId || '',
        type: mappedType,
        numbers: normalizeNumbers(pb.numbers),
        amount: Number(pb.amount || 0),
        drawId: String(pb.drawId || ''),
        createdAt: new Date(pb.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        timestamp: pb.timestamp,
        isPending: pb.status !== 'synced',
        receiptCode: pb.receiptCode,
        betTypeId: pb.betTypeCode || pb.betTypeId,
        betTypeCode: pb.betTypeCode,
        ownerStructure: pb.ownerStructure,
        status: pb.status || 'pending',
        fingerprint: pb.fingerprint // FIX: Preservar fingerprint del dominio
    } as BetType & { fingerprint?: typeof pb.fingerprint };
};
