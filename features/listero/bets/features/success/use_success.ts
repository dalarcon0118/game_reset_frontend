import { useMemo, useCallback, useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { selectBetsModel, selectDispatch, useBetsStore } from '../../core/store';
import { SuccessMsgType, VoucherMetadata } from './success.types';
import ViewShot from 'react-native-view-shot';
import { DrawService } from '@/shared/services/draw';
import { ExtendedDrawType } from '@/shared/services/draw';
import { BetService } from '@/shared/services/bet';
import { BetType } from '@/types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('USE_SUCCESS_HOOK');

/**
 * Utility to format numbers from various backend formats into a string array.
 */
const formatNumbers = (numbers: any): string[] => {
    let parsed = numbers;
    if (typeof numbers === 'string' && (numbers.startsWith('{') || numbers.startsWith('['))) {
        try {
            parsed = JSON.parse(numbers);
        } catch {
            // If parsing fails, treat as normal string
        }
    }

    // If it's an array (like Parlet), they are already individual numbers
    if (Array.isArray(parsed)) {
        return parsed.map(String);
    }

    // If it's an object, extract values based on type
    if (typeof parsed === 'object' && parsed !== null) {
        if (parsed.numbers && Array.isArray(parsed.numbers)) {
            // For parlets: {"numbers": [1,2,3]}
            return parsed.numbers.map(String);
        }
        if (parsed.number !== undefined) {
            // For other types: {"number": "123456"} or {"number": 20}
            return [String(parsed.number)];
        } else {
            return Object.values(parsed).map(String);
        }
    }

    // If it's a string or number (like "15689" or 20)
    const s = String(parsed || '').trim();
    if (!s) return [];

    // If it already has separators, use them
    if (s.includes('-') || s.includes(' ') || s.includes(',')) {
        return s.split(/[- ,]+/).filter(Boolean);
    }

    // If it has parentheses, extract the content
    if (s.includes('(')) {
        return s.match(/\(([^)]+)\)/g)?.map(m => m.slice(1, -1)) || [s];
    }

    // Default format: pairs of 2 digits from the right (e.g., 15689 -> 1, 56, 89)
    const result = [];
    let current = s;
    while (current.length > 0) {
        if (current.length >= 2) {
            result.unshift(current.slice(-2));
            current = current.slice(0, -2);
        } else {
            result.unshift(current);
            current = "";
        }
    }
    return result;
};

export const useSuccess = () => {
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);
    const [drawDetails, setDrawDetails] = useState<ExtendedDrawType | null>(null);

    const { betId, receiptCode: paramReceiptCode } = useLocalSearchParams<{ betId: string, receiptCode: string }>();
    const drawId = model.drawId;

    // Load draw details
    useEffect(() => {
        if (drawId) {
            DrawService.getOne(drawId).then(details => {
                if (details) setDrawDetails(details);
            });
        }
    }, [drawId]);

    // State for fresh bets data from backend
    const [freshBetsData, setFreshBetsData] = useState<any>(null);

    // Load fresh bets data when drawId is available and we're accessing from list
    useEffect(() => {
        if (!drawId || betId) return;

        // Si ya tenemos los datos en el estado global para este sorteo, los usamos en lugar de pedir a la API
        if (model.listSession.remoteData.type === 'Success' && model.listSession.loadedDrawId === drawId) {
            log.debug('Using data from listSession instead of API call');
            const bets = [
                ...model.listSession.remoteData.data.fijosCorridos.map((b: any) => ({ ...b, type: 'Fijo/Corrido', numbers: JSON.stringify({ number: b.bet }), amount: (b.fijoAmount || 0) + (b.corridoAmount || 0) })),
                ...model.listSession.remoteData.data.parlets.map((b: any) => ({ ...b, type: 'Parlet', numbers: JSON.stringify(b.bets) })),
                ...model.listSession.remoteData.data.centenas.map((b: any) => ({ ...b, type: 'Centena', numbers: JSON.stringify({ number: b.bet }) })),
                ...model.listSession.remoteData.data.loteria.map((b: any) => ({ ...b, type: 'Lotería', numbers: JSON.stringify({ number: b.bet }) }))
            ];

            const filteredBets = paramReceiptCode
                ? bets.filter(bet => bet.receiptCode === paramReceiptCode)
                : bets;

            const transformedData = {
                fijosCorridos: filteredBets
                    .filter(bet => bet.type === 'Fijo/Corrido')
                    .map(bet => {
                        const numbers = formatNumbers(bet.numbers);
                        return {
                            id: bet.id,
                            bet: numbers[0] || '0',
                            fijoAmount: bet.fijoAmount || 0,
                            corridoAmount: bet.corridoAmount || 0,
                            receiptCode: bet.receiptCode
                        };
                    }),
                parlets: filteredBets
                    .filter(bet => bet.type === 'Parlet')
                    .map(bet => ({
                        id: bet.id,
                        bets: formatNumbers(bet.numbers),
                        amount: bet.amount,
                        receiptCode: bet.receiptCode
                    })),
                centenas: filteredBets
                    .filter(bet => bet.type === 'Centena')
                    .map(bet => ({
                        id: bet.id,
                        bet: formatNumbers(bet.numbers)[0] || '0',
                        amount: bet.amount,
                        receiptCode: bet.receiptCode
                    })),
                loteria: filteredBets
                    .filter(bet => bet.type === 'Lotería')
                    .map(bet => ({
                        id: bet.id,
                        bet: formatNumbers(bet.numbers)[0] || '0',
                        amount: bet.amount,
                        receiptCode: bet.receiptCode
                    }))
            };
            setFreshBetsData(transformedData);
            return;
        }

        // Si no están en el estado, los pedimos a la API
        BetService.list({ drawId }).then(bets => {
            if (bets.length > 0) {
                // Filter by receipt code if provided
                const filteredBets = paramReceiptCode
                    ? bets.filter(bet => bet.receiptCode === paramReceiptCode)
                    : bets;

                // Transform bets to match the expected format
                const transformedData = {
                    fijosCorridos: filteredBets
                        .filter(bet => {
                            const betType = typeof bet.type === 'string' ? bet.type.toLowerCase() : '';
                            return betType === 'fijo' || betType === 'corrido';
                        })
                        .map(bet => {
                            const numbers = formatNumbers(bet.numbers);
                            return {
                                id: bet.id,
                                bet: numbers[0] || '0',
                                fijoAmount: typeof bet.type === 'string' && bet.type.toLowerCase() === 'fijo' ? bet.amount : null,
                                corridoAmount: typeof bet.type === 'string' && bet.type.toLowerCase() === 'corrido' ? bet.amount : null,
                                receiptCode: bet.receiptCode
                            };
                        }),
                    parlets: filteredBets
                        .filter(bet => {
                            const betType = typeof bet.type === 'string' ? bet.type.toLowerCase() : '';
                            return betType === 'parlet';
                        })
                        .map(bet => ({
                            id: bet.id,
                            bets: formatNumbers(bet.numbers),
                            amount: bet.amount,
                            receiptCode: bet.receiptCode
                        })),
                    centenas: filteredBets
                        .filter(bet => {
                            const betType = typeof bet.type === 'string' ? bet.type.toLowerCase() : '';
                            return betType === 'centena';
                        })
                        .map(bet => ({
                            id: bet.id,
                            bet: formatNumbers(bet.numbers)[0] || '0',
                            amount: bet.amount,
                            receiptCode: bet.receiptCode
                        })),
                    loteria: filteredBets
                        .filter(bet => {
                            const betType = typeof bet.type === 'string' ? bet.type.toLowerCase() : '';
                            return betType === 'loteria' || betType === 'cuaterna semanal';
                        })
                        .map(bet => ({
                            id: bet.id,
                            bet: formatNumbers(bet.numbers)[0] || '0',
                            amount: bet.amount,
                            receiptCode: bet.receiptCode
                        }))
                };

                setFreshBetsData(transformedData);
            }
        }).catch(error => {
            log.error('Error loading fresh bets data', error);
        });
    }, [drawId, betId]);

    const metadata = useMemo<VoucherMetadata>(() => {
        const now = new Date();
        const issueDate = now.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const awardDate = drawDetails?.draw_datetime
            ? new Date(drawDetails.draw_datetime).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
            : 'Pendiente';

        // Intentamos obtener el premio de los metadatos del sorteo (Jackpot)
        let totalPrize = 'Según Reglas';

        // Función auxiliar para obtener datos de extra_data (manejando posible string)
        const getExtraDataValue = (obj: any, key: string) => {
            if (!obj) return undefined;
            let data = obj;
            if (typeof obj === 'string') {
                try {
                    data = JSON.parse(obj);
                } catch (e) {
                    return undefined;
                }
            }
            return data[key];
        };

        const jackpotFromDraw = getExtraDataValue(drawDetails?.extra_data, 'jackpot_amount');
        const jackpotFromType = getExtraDataValue((drawDetails as any)?.draw_type_details?.extra_data, 'jackpot_amount');

        const jackpot = jackpotFromDraw !== undefined ? jackpotFromDraw : jackpotFromType;

        const currency = getExtraDataValue(drawDetails?.extra_data, 'currency') ||
            getExtraDataValue((drawDetails as any)?.draw_type_details?.extra_data, 'currency') ||
            'DOP';

        if (jackpot !== undefined && jackpot !== null && jackpot !== '') {
            try {
                const amount = typeof jackpot === 'string' ? parseFloat(jackpot) : Number(jackpot);
                if (!isNaN(amount)) {
                    totalPrize = new Intl.NumberFormat('es-DO', {
                        style: 'currency',
                        currency: currency,
                        minimumFractionDigits: 2
                    }).format(amount);
                }
            } catch (e) {
                log.error('Error formatting jackpot', { jackpot, error: e });
                totalPrize = `${currency} ${jackpot}`;
            }
        }

        // Si después de intentar el jackpot sigue siendo "Según Reglas", probamos con las reglas
        if (totalPrize === 'Según Reglas' && model.rules.data?.reward_rules) {
            // Buscamos una regla que parezca indicar el premio máximo o principal
            const mainRule = model.rules.data.reward_rules.find((r: any) =>
                r.name.toLowerCase().includes('fijo') ||
                r.name.toLowerCase().includes('exacta')
            );

            if (mainRule && (mainRule as any).prizesPerDollar) {
                const prizes = (mainRule as any).prizesPerDollar;
                const maxPrize = Math.max(prizes.fijo || 0, prizes.corrido || 0, prizes.parlet || 0, prizes.centena || 0);
                if (maxPrize > 0) {
                    totalPrize = `$${maxPrize} por cada $1`;
                }
            }
        }

        return {
            issueDate,
            awardDate,
            totalPrize,
            disclaimer: 'Este comprobante contiene los números de premiación, es personal e intransferible, debe preservarse hasta la fecha en que se emita la premiación. Es importante mantener estas informaciones dependientes del id del sorteo, porque en otros tipos de sorteos estos datos pueden cambiar.'
        };
    }, [drawDetails, model.rules.data]);

    const managementData = useMemo(() => {
        const status = model.managementSession.saveStatus;
        if (status.type === 'Success') {
            log.debug('managementData from session', status.data);
            return status.data;
        }
        return null;
    }, [model.managementSession.saveStatus]);

    const receiptCode = useMemo(() => {
        if (paramReceiptCode) return paramReceiptCode;

        log.debug('Computing receiptCode', { betIdFromParams: betId, hasManagementData: !!managementData, hasFreshBetsData: !!freshBetsData });
        if (managementData) {
            log.debug('managementData details', {
                type: Array.isArray(managementData) ? 'array' : typeof managementData,
                keys: Object.keys(Array.isArray(managementData) ? (managementData[0] || {}) : managementData)
            });
        }

        // Primero intentamos sacar el código de los datos frescos del backend
        if (freshBetsData) {
            const allFreshBets = [
                ...(freshBetsData.fijosCorridos || []),
                ...(freshBetsData.parlets || []),
                ...(freshBetsData.centenas || []),
                ...(freshBetsData.loteria || [])
            ];
            const freshBetWithCode = allFreshBets.find((b: any) => b.receiptCode && b.receiptCode !== '-----');
            if (freshBetWithCode) {
                const code = freshBetWithCode.receiptCode;
                log.debug('Found code in freshBetsData', { code });
                return code;
            }
        }

        // Si no está ahí, intentamos sacar el código del estado de guardado reciente
        if (managementData) {
            if (Array.isArray(managementData)) {
                const betWithCode = managementData.find((b: any) => (b as any).receiptCode || (b as any).receipt_code);
                if (betWithCode) {
                    const code = (betWithCode as any).receiptCode || (betWithCode as any).receipt_code;
                    log.debug('Found code in managementData (array)', { code });
                    return code;
                }
            } else if ((managementData as any).receiptCode || (managementData as any).receipt_code) {
                const code = (managementData as any).receiptCode || (managementData as any).receipt_code;
                log.debug('Found code in managementData (object)', { code });
                return code;
            }
        }

        // Si no está ahí, lo buscamos en las apuestas actuales de la sesión
        if (model.listSession.remoteData.type === 'Success') {
            const data = model.listSession.remoteData.data;
            const allBets = [
                ...(data.fijosCorridos || []),
                ...(data.parlets || []),
                ...(data.centenas || []),
                ...(data.loteria || [])
            ];
            const betWithCode = allBets.find((b: any) => b.receiptCode || b.receipt_code);
            if (betWithCode) {
                const code = (betWithCode as any).receiptCode || (betWithCode as any).receipt_code;
                log.debug('Found code in listSession', { code });
                return code;
            }

            // Si no encontramos código en las apuestas, pero hay apuestas, usamos el ID de la primera como fallback
            if (allBets.length > 0) {
                const firstBet = allBets[0];
                if (firstBet.id) {
                    log.debug('Using first bet ID as fallback receipt code', { id: firstBet.id });
                    return firstBet.id;
                }
            }
        }

        // Fallback al betId que viene por parámetros de navegación
        if (betId) {
            log.debug('Using betId from params as fallback', { betId });
            return betId;
        }

        log.debug('No receipt code found, using default placeholder');
        return '-----';
    }, [managementData, model.listSession.remoteData, betId, freshBetsData]);


    const bets = useMemo(() => {
        const processRawBets = (data: any[]): any[] => {
            const groupedFijosCorridos = new Map<string, any>();
            const otherBets: any[] = [];

            data.forEach((b: any) => {
                const numbers = formatNumbers(b.numbers || b.bet || b.bets);
                const type = typeof b.type === 'string' ? b.type.toLowerCase() : '';

                if (type === 'fijo' || type === 'corrido' || b.type === 'Fijo/Corrido') {
                    const numStr = numbers[0];
                    const existing = groupedFijosCorridos.get(numStr) || {
                        id: b.id,
                        type: 'Fijo/Corrido',
                        numbers: [numStr],
                        amount: 0,
                        fijoAmount: 0,
                        corridoAmount: 0
                    };

                    const amount = Number(b.amount || 0);
                    const fijo = Number(b.fijoAmount || (type === 'fijo' ? b.amount : 0));
                    const corrido = Number(b.corridoAmount || (type === 'corrido' ? b.amount : 0));

                    existing.fijoAmount += fijo;
                    existing.corridoAmount += corrido;
                    existing.amount = existing.fijoAmount + existing.corridoAmount;

                    groupedFijosCorridos.set(numStr, existing);
                } else {
                    otherBets.push({
                        id: b.id,
                        type: b.type === 'Centena' ? 'Centena' : b.type,
                        numbers: b.type === 'Centena' ? [numbers.join('')] : numbers,
                        amount: Number(b.amount || 0),
                        fijoAmount: 0,
                        corridoAmount: 0,
                    });
                }
            });

            return [...Array.from(groupedFijosCorridos.values()), ...otherBets];
        };

        if (managementData) {
            const dataArray = Array.isArray(managementData) ? managementData : [managementData];
            return processRawBets(dataArray);
        }

        if (model.listSession.remoteData.type === 'Success') {
            const data = model.listSession.remoteData.data;

            const rawFijos = data.fijosCorridos.map((b: any) => ({
                id: b.id || Math.random().toString(),
                type: 'Fijo/Corrido',
                numbers: formatNumbers(b.bet),
                amount: (Number(b.fijoAmount) || 0) + (Number(b.corridoAmount) || 0),
                fijoAmount: Number(b.fijoAmount) || 0,
                corridoAmount: Number(b.corridoAmount) || 0
            }));

            const rawParlets = data.parlets.map((b: any) => ({
                id: b.id || Math.random().toString(),
                type: 'Parlet',
                numbers: b.bets.map(String),
                amount: Number(b.amount) || 0
            }));

            const rawCentenas = data.centenas.map((b: any) => ({
                id: b.id || Math.random().toString(),
                type: 'Centena',
                numbers: [formatNumbers(b.bet).join('')],
                amount: Number(b.amount) || 0
            }));

            const rawLoteria = data.loteria.map((b: any) => ({
                id: b.id || Math.random().toString(),
                type: 'Lotería',
                numbers: formatNumbers(b.bet),
                amount: Number(b.amount) || 0
            }));

            return processRawBets([...rawFijos, ...rawParlets, ...rawCentenas, ...rawLoteria]);
        }
        return [];
    }, [managementData, model.listSession.remoteData]);

    const isBolita = useMemo(() => {
        return bets.some(b => b.type === 'Fijo/Corrido' || b.type === 'Parlet' || b.type === 'Centena');
    }, [bets]);

    const groupedBets = useMemo(() => {
        if (!isBolita) return null;

        return {
            fijosCorridos: bets.filter(b => b.type === 'Fijo/Corrido'),
            parlets: bets.filter(b => b.type === 'Parlet'),
            centenas: bets.filter(b => b.type === 'Centena'),
        };
    }, [bets, isBolita]);

    const totalAmount = useMemo(() => {
        return bets.reduce((acc, curr: any) => acc + (curr.amount || 0), 0);
    }, [bets]);

    const handleShare = useCallback(async (viewShotRef: React.RefObject<ViewShot>) => {
        try {
            log.debug('handleShare initiated');
            if (!viewShotRef.current?.capture) {
                log.warn('viewShotRef.current or capture is undefined');
                return;
            }

            const uri = await viewShotRef.current.capture();
            log.debug('Voucher captured successfully', { uri });

            dispatch({ type: 'SUCCESS', payload: { type: SuccessMsgType.SHARE_VOUCHER_REQUESTED, uri } });
        } catch (error) {
            log.error('Error capturing voucher', { error });
            dispatch({
                type: 'SUCCESS',
                payload: {
                    type: SuccessMsgType.SHARE_VOUCHER_RESPONSE,
                    webData: { type: 'Failure', error: 'Error al capturar la imagen del voucher' }
                }
            });
        }
    }, [dispatch]);

    const handleBack = useCallback(() => {
        dispatch({ type: 'SUCCESS', payload: { type: SuccessMsgType.GO_HOME_REQUESTED } });
    }, [dispatch]);

    return {
        receiptCode,
        bets,
        groupedBets,
        isBolita,
        totalAmount,
        metadata,
        handleShare,
        handleBack,
        drawId: model.drawId
    };
};
