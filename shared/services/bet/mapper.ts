import { BetType } from '@/types';
import { BackendBet, ListBetsFilters } from './types';
import { PendingBetV2 } from '../offline/types';
import { logger } from '@/shared/utils/logger';
import { BET_TYPE_KEYS, BetTypeKind, BACKEND_BET_CODES, BET_TYPE_KEYWORDS, UI_CONSTANTS } from '@/shared/types/bet_types';
import { GameType } from '@/types';

const log = logger.withTag('BET_MAPPER');

export const mapBackendBetToFrontend = (backendBet: BackendBet, betTypes: GameType[] = []): BetType => {
    try {
        log.debug('Mapping backend bet', { backendBet });

        // Determinar el tipo de apuesta
        const betTypeId = backendBet.bet_type?.toString();
        const betTypeFromCache = betTypes.find(t => t.id?.toString() === betTypeId);

        let mappedType: BetTypeKind = BET_TYPE_KEYS.FIJO;
        let rawType = '';
        let gameTypeName = backendBet.game_type_details?.name || '';
        let betTypeName = backendBet.bet_type_details?.name || '';

        if (betTypeFromCache) {
            const code = (betTypeFromCache.code || '').toUpperCase();
            const name = (betTypeFromCache.name || '').toUpperCase();

            gameTypeName = betTypeFromCache.name || '';
            betTypeName = name; // Usamos el nombre del caché

            if (code === BACKEND_BET_CODES.LOTERIA || name.includes(BET_TYPE_KEYWORDS.LOTERIA)) {
                mappedType = BET_TYPE_KEYS.LOTERIA;
            } else if (code === BACKEND_BET_CODES.WEEKLY || code === BACKEND_BET_CODES.CUATERNA ||
                code === BACKEND_BET_CODES.CUATERNA_SEMANAL ||
                name.includes(BET_TYPE_KEYWORDS.CUATERNA) || name.includes(BET_TYPE_KEYWORDS.SEMANAL)) {
                mappedType = BET_TYPE_KEYS.CUATERNA_SEMANAL;
            } else if (code.includes(BACKEND_BET_CODES.PARLET) || name.includes(BET_TYPE_KEYWORDS.PARLET)) {
                mappedType = BET_TYPE_KEYS.PARLET;
            } else if (code.includes(BACKEND_BET_CODES.CORRIDO) || name.includes(BET_TYPE_KEYWORDS.CORRIDO)) {
                mappedType = BET_TYPE_KEYS.CORRIDO;
            } else if (code.includes(BACKEND_BET_CODES.CENTENA) || name.includes(BET_TYPE_KEYWORDS.CENTENA)) {
                mappedType = BET_TYPE_KEYS.CENTENA;
            } else if (code.includes(BACKEND_BET_CODES.FIJO) || name.includes(BET_TYPE_KEYWORDS.FIJO)) {
                mappedType = BET_TYPE_KEYS.FIJO;
            }
            rawType = betTypeFromCache.name || '';
        } else {
            // Fallback: usar nombres del backendBet
            rawType = gameTypeName || betTypeName || UI_CONSTANTS.UNKNOWN_TYPE;
            const lowerType = rawType.toLowerCase();

            if (lowerType.includes(BET_TYPE_KEYWORDS.FIJO.toLowerCase())) {
                mappedType = BET_TYPE_KEYS.FIJO;
            } else if (lowerType.includes(BET_TYPE_KEYWORDS.PARLET.toLowerCase())) {
                mappedType = BET_TYPE_KEYS.PARLET;
            } else if (lowerType.includes(BET_TYPE_KEYWORDS.CORRIDO.toLowerCase())) {
                mappedType = BET_TYPE_KEYS.CORRIDO;
            } else if (lowerType.includes(BET_TYPE_KEYWORDS.CENTENA.toLowerCase())) {
                mappedType = BET_TYPE_KEYS.CENTENA;
            } else if (lowerType.includes(BET_TYPE_KEYWORDS.LOTERIA.toLowerCase()) ||
                lowerType.includes(BET_TYPE_KEYWORDS.LOTERIA_ACCENT.toLowerCase())) {
                mappedType = BET_TYPE_KEYS.LOTERIA;
            } else if (lowerType.includes(BET_TYPE_KEYWORDS.CUATERNA.toLowerCase()) ||
                lowerType.includes(BET_TYPE_KEYWORDS.SEMANAL.toLowerCase())) {
                mappedType = BET_TYPE_KEYS.CUATERNA_SEMANAL;
            } else {
                // Fallback final: intentar inferir del código
                const code = (backendBet.bet_type_details?.code || '').toLowerCase();
                if (code.includes(BACKEND_BET_CODES.FIJO.toLowerCase())) mappedType = BET_TYPE_KEYS.FIJO;
                else if (code.includes(BACKEND_BET_CODES.PARLET.toLowerCase())) mappedType = BET_TYPE_KEYS.PARLET;
                else if (code.includes(BACKEND_BET_CODES.CORRIDO.toLowerCase())) mappedType = BET_TYPE_KEYS.CORRIDO;
                else if (code.includes(BACKEND_BET_CODES.CENTENA.toLowerCase())) mappedType = BET_TYPE_KEYS.CENTENA;
                else if (code.includes(BACKEND_BET_CODES.LOTERIA.toLowerCase())) mappedType = BET_TYPE_KEYS.LOTERIA;
                else if (code.includes(BACKEND_BET_CODES.CUATERNA.toLowerCase())) mappedType = BET_TYPE_KEYS.CUATERNA_SEMANAL;
                else mappedType = BET_TYPE_KEYS.FIJO; // Default
            }
        }

        log.debug(`Mapping bet result`, {
            id: backendBet.id,
            game_type: gameTypeName,
            bet_type: betTypeName,
            rawType,
            mappedType
        });

        // Extraer números de forma limpia (evitar JSON string si es posible)
        let cleanNumbers: string;
        const rawNumbers = backendBet.numbers_played;

        if (typeof rawNumbers === 'string') {
            try {
                const parsed = JSON.parse(rawNumbers);
                if (typeof parsed === 'object' && parsed !== null) {
                    cleanNumbers = parsed.number || parsed.bet || JSON.stringify(parsed);
                } else {
                    cleanNumbers = String(parsed);
                }
            } catch {
                cleanNumbers = rawNumbers;
            }
        } else if (typeof rawNumbers === 'object' && rawNumbers !== null) {
            // Manejar formato {"number": "054"} o {"bet": 54} o {"numbers": [12, 34]}
            const val = (rawNumbers as any).number || (rawNumbers as any).bet || (rawNumbers as any).numbers;
            if (val !== undefined) {
                cleanNumbers = Array.isArray(val) ? val.join(UI_CONSTANTS.BET_NUMBER_DELIMITER) : String(val);
            } else {
                cleanNumbers = JSON.stringify(rawNumbers);
            }
        } else {
            cleanNumbers = String(rawNumbers);
        }

        // Eliminar ceros a la izquierda solo para tipos que no son Centena o Loteria
        if (mappedType === BET_TYPE_KEYS.FIJO || mappedType === BET_TYPE_KEYS.CORRIDO || mappedType === BET_TYPE_KEYS.PARLET) {
            if (cleanNumbers.includes(UI_CONSTANTS.BET_NUMBER_DELIMITER)) {
                cleanNumbers = cleanNumbers.split(UI_CONSTANTS.BET_NUMBER_DELIMITER).map(n => parseInt(n, 10).toString()).join(UI_CONSTANTS.BET_NUMBER_DELIMITER);
            } else if (!isNaN(parseInt(cleanNumbers, 10))) {
                cleanNumbers = parseInt(cleanNumbers, 10).toString();
            }
        }

        return {
            id: (backendBet.id || backendBet.receipt_code || Math.random().toString(36).substring(7)).toString(),
            type: mappedType,
            numbers: cleanNumbers,
            amount: backendBet.amount ? parseFloat(backendBet.amount.toString()) : 0,
            draw: backendBet.draw?.toString() || '',
            createdAt: backendBet.created_at ? new Date(backendBet.created_at).toLocaleTimeString(UI_CONSTANTS.DEFAULT_LOCALE, {
                hour: '2-digit',
                minute: '2-digit'
            }) : new Date().toLocaleTimeString(UI_CONSTANTS.DEFAULT_LOCALE, {
                hour: '2-digit',
                minute: '2-digit'
            }),
            receiptCode: backendBet.receipt_code || UI_CONSTANTS.EMPTY_RECEIPT_CODE,
            betTypeId: backendBet.bet_type // Almacenamos el ID del backend
        };
    } catch (error) {
        log.error('Error mapping bet', error, { backendBet });
        throw error;
    }
};

export const mapPendingBetsToFrontend = (pendingBets: PendingBetV2[], filters?: ListBetsFilters, betTypes: GameType[] = []): BetType[] => {
    let relevantPendingBets = pendingBets;

    if (filters?.drawId) {
        relevantPendingBets = relevantPendingBets.filter(pb => (pb.draw || pb.drawId)?.toString() === filters.drawId);
    }

    if (filters?.receiptCode) {
        log.debug('FILTRO OFFLINE: receiptCode buscado', { filterReceiptCode: filters.receiptCode });
        relevantPendingBets = relevantPendingBets.filter(pb => {
            const match = pb.receiptCode === filters.receiptCode;
            log.debug('COMPARANDO receiptCode offline', {
                pbReceiptCode: pb.receiptCode,
                filterReceiptCode: filters.receiptCode,
                match
            });
            return match;
        });
    }

    const offlineBets: BetType[] = [];

    relevantPendingBets.forEach(pb => {
        const drawId = (pb.draw || pb.drawId || '').toString();
        const createdAt = new Date(pb.timestamp).toLocaleTimeString(UI_CONSTANTS.DEFAULT_LOCALE, {
            hour: '2-digit',
            minute: '2-digit'
        });
        const receiptCode = pb.receiptCode || UI_CONSTANTS.PENDING_OFFLINE_PREFIX;

        if (pb.amount && pb.numbers_played) {
            offlineBets.push(mapSinglePendingBetToFrontend(pb, betTypes));
        }

        if (pb.fijosCorridos && Array.isArray(pb.fijosCorridos)) {
            pb.fijosCorridos.forEach((item, idx) => {
                if (item.fijoAmount) {
                    offlineBets.push({
                        id: `${UI_CONSTANTS.OFFLINE_ID_PREFIX}-${pb.offlineId}-${UI_CONSTANTS.FIJO_LABEL}-${idx}`,
                        type: BET_TYPE_KEYS.FIJO,
                        numbers: JSON.stringify({ number: item.bet }),
                        amount: item.fijoAmount,
                        draw: drawId,
                        createdAt,
                        isPending: true,
                        receiptCode,
                        betTypeId: item.fijoBetTypeId
                    });
                }
                if (item.corridoAmount) {
                    offlineBets.push({
                        id: `${UI_CONSTANTS.OFFLINE_ID_PREFIX}-${pb.offlineId}-${UI_CONSTANTS.CORRIDO_LABEL}-${idx}`,
                        type: BET_TYPE_KEYS.CORRIDO,
                        numbers: JSON.stringify({ number: item.bet }),
                        amount: item.corridoAmount,
                        draw: drawId,
                        createdAt,
                        isPending: true,
                        receiptCode,
                        betTypeId: item.corridoBetTypeId
                    });
                }
            });
        }

        if (pb.parlets && Array.isArray(pb.parlets)) {
            pb.parlets.forEach((item, idx) => {
                offlineBets.push({
                    id: `${UI_CONSTANTS.OFFLINE_ID_PREFIX}-${pb.offlineId}-${UI_CONSTANTS.PARLET_LABEL}-${idx}`,
                    type: BET_TYPE_KEYS.PARLET,
                    numbers: JSON.stringify({ numbers: item.bets }),
                    amount: item.amount,
                    draw: drawId,
                    createdAt,
                    isPending: true,
                    receiptCode,
                    betTypeId: item.parletBetTypeId
                });
            });
        }

        if (pb.centenas && Array.isArray(pb.centenas)) {
            pb.centenas.forEach((item, idx) => {
                offlineBets.push({
                    id: `${UI_CONSTANTS.OFFLINE_ID_PREFIX}-${pb.offlineId}-${UI_CONSTANTS.CENTENA_LABEL}-${idx}`,
                    type: BET_TYPE_KEYS.CENTENA,
                    numbers: JSON.stringify({ number: item.bet }),
                    amount: item.amount,
                    draw: drawId,
                    createdAt,
                    isPending: true,
                    receiptCode,
                    betTypeId: item.centenaBetTypeId
                });
            });
        }

        if (pb.loteria && Array.isArray(pb.loteria)) {
            pb.loteria.forEach((item, idx) => {
                // Si es offline, por defecto usamos LOTERIA, 
                // pero el Voucher lo hidratará con el nombre real (ej: Cuaterna) usando el betTypeId
                offlineBets.push({
                    id: `${UI_CONSTANTS.OFFLINE_ID_PREFIX}-${pb.offlineId}-${UI_CONSTANTS.LOTERIA_LABEL}-${idx}`,
                    type: BET_TYPE_KEYS.LOTERIA,
                    numbers: JSON.stringify({ bet: item.bet }),
                    amount: item.amount,
                    draw: drawId,
                    createdAt,
                    isPending: true,
                    receiptCode,
                    betTypeId: item.betTypeid || item.loteriaBetTypeId
                });
            });
        }
    });

    return offlineBets;
};

export const mapSinglePendingBetToFrontend = (pb: PendingBetV2, betTypes: GameType[] = []): BetType => {
    // Intentar inferir el tipo mapeado si tenemos betTypeId y cache
    const betTypeId = (pb.betTypeid || '').toString();
    const betTypeFromCache = betTypes.find(t => t.id?.toString() === betTypeId);

    let mappedType: BetTypeKind = BET_TYPE_KEYS.FIJO;

    if (betTypeFromCache) {
        const code = (betTypeFromCache.code || '').toUpperCase();
        if (code === BACKEND_BET_CODES.LOTERIA || code === BACKEND_BET_CODES.WEEKLY || code === BACKEND_BET_CODES.CUATERNA) {
            mappedType = BET_TYPE_KEYS.LOTERIA;
        } else if (code.includes(BACKEND_BET_CODES.PARLET)) {
            mappedType = BET_TYPE_KEYS.PARLET;
        } else if (code.includes(BACKEND_BET_CODES.CORRIDO)) {
            mappedType = BET_TYPE_KEYS.CORRIDO;
        } else if (code.includes(BACKEND_BET_CODES.CENTENA)) {
            mappedType = BET_TYPE_KEYS.CENTENA;
        }
    }

    return {
        id: `${UI_CONSTANTS.OFFLINE_ID_PREFIX}-${pb.offlineId}`,
        type: mappedType,
        numbers: JSON.stringify(pb.numbers_played || []),
        amount: pb.amount || 0,
        draw: (pb.draw || pb.drawId || '').toString(),
        createdAt: new Date(pb.timestamp).toLocaleTimeString(UI_CONSTANTS.DEFAULT_LOCALE, {
            hour: '2-digit',
            minute: '2-digit'
        }),
        isPending: true,
        receiptCode: pb.receiptCode || UI_CONSTANTS.PENDING_OFFLINE_PREFIX,
        betTypeId: pb.betTypeid // Inyectar ID dinámico para hidratación posterior
    };
};
