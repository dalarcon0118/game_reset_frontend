import { useMemo, useCallback, useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { selectBetsModel, selectDispatch, useBetsStore } from '../../core/store';
import { SuccessMsgType, VoucherMetadata } from './success.types';
import ViewShot from 'react-native-view-shot';
import { DrawService } from '@/shared/services/Draw';
import { ExtendedDrawType } from '@/shared/services/Draw';

export const useSuccess = () => {
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);
    const [drawDetails, setDrawDetails] = useState<ExtendedDrawType | null>(null);

    const { betId } = useLocalSearchParams<{ betId: string }>();
    const drawId = model.drawId;

    useEffect(() => {
        if (drawId) {
            DrawService.getOne(drawId).then(details => {
                if (details) setDrawDetails(details);
            });
        }
    }, [drawId]);

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
                console.error('[useSuccess] Error formatting jackpot:', e);
                totalPrize = `${currency} ${jackpot}`;
            }
        }

        // Si después de intentar el jackpot sigue siendo "Según Reglas", probamos con las reglas
        if (totalPrize === 'Según Reglas' && model.rules.data?.reward_rules) {
            // Buscamos una regla que parezca indicar el premio máximo o principal
            const mainRule = model.rules.data.reward_rules.find(r =>
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
            console.log('[useSuccess] managementData:', status.data);
            return status.data;
        }
        return null;
    }, [model.managementSession.saveStatus]);

    const receiptCode = useMemo(() => {
        console.log('[useSuccess] Computing receiptCode. betId from params:', betId);
        console.log('[useSuccess] managementData present:', !!managementData);
        if (managementData) {
            console.log('[useSuccess] managementData type:', Array.isArray(managementData) ? 'array' : typeof managementData);
            console.log('[useSuccess] managementData keys:', Object.keys(Array.isArray(managementData) ? (managementData[0] || {}) : managementData));
        }

        // Primero intentamos sacar el código del estado de guardado reciente
        if (managementData) {
            if (Array.isArray(managementData)) {
                const betWithCode = managementData.find(b => (b as any).receiptCode || (b as any).receipt_code);
                if (betWithCode) {
                    const code = (betWithCode as any).receiptCode || (betWithCode as any).receipt_code;
                    console.log('[useSuccess] Found code in managementData (array):', code);
                    return code;
                }
            } else if ((managementData as any).receiptCode || (managementData as any).receipt_code) {
                const code = (managementData as any).receiptCode || (managementData as any).receipt_code;
                console.log('[useSuccess] Found code in managementData (object):', code);
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
                console.log('[useSuccess] Found code in listSession:', code);
                return code;
            }
        }

        // Fallback al betId que viene por parámetros de navegación
        if (betId) {
            console.log('[useSuccess] Using betId from params as fallback:', betId);
            return betId;
        }

        console.log('[useSuccess] No receipt code found, using default placeholder');
        return '-----';
    }, [managementData, model.listSession.remoteData, betId]);

    const bets = useMemo(() => {
        const formatNumbers = (numbers: any): string[] => {
            let parsed = numbers;
            if (typeof numbers === 'string' && (numbers.startsWith('{') || numbers.startsWith('['))) {
                try {
                    parsed = JSON.parse(numbers);
                } catch {
                    // Si falla el parseo, lo tratamos como string normal
                }
            }
            console.log('[formatNumbers] parsed:', parsed);

            // Si es un array (como Parlet), ya son números individuales
            if (Array.isArray(parsed)) {
                return parsed.map(String);
            }

            // Si es un objeto, extraemos los valores según el tipo
            if (typeof parsed === 'object' && parsed !== null) {
                if (parsed.numbers && Array.isArray(parsed.numbers)) {
                    // Para parlets: {"numbers": [1,2,3]}
                    return parsed.numbers.map(String);
                }
                if (parsed.number !== undefined) {
                    // Para otros tipos: {"number": "123456"} o {"number": 20}
                    parsed = parsed.number;
                } else {
                    return Object.values(parsed).map(String);
                }
            }

            // Si es un string o número (como "15689" o 20)
            const s = String(parsed || '').trim();
            if (!s) return [];

            // Si ya tiene separadores, los usamos
            if (s.includes('-') || s.includes(' ') || s.includes(',')) {
                return s.split(/[- ,]+/).filter(Boolean);
            }

            // Si tiene paréntesis, extraemos lo de adentro
            if (s.includes('(')) {
                return s.match(/\(([^)]+)\)/g)?.map(m => m.slice(1, -1)) || [s];
            }

            // Formato por defecto: pares de 2 dígitos desde la derecha (ej: 15689 -> 1, 56, 89)
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

        const processRawBets = (data: any[]): any[] => {
            return data.map(b => {
                const numbers = formatNumbers(b.numbers || b.bet || b.bets);
                let displayType: string = b.type;
                if (b.type === 'Fijo' || b.type === 'Corrido') {
                    displayType = 'Fijo/Corrido';
                }

                return {
                    id: b.id,
                    type: displayType,
                    numbers,
                    amount: b.amount || ((b as any).fijoAmount || 0) + ((b as any).corridoAmount || 0),
                    fijoAmount: b.fijoAmount,
                    corridoAmount: b.corridoAmount,
                };
            });
        };

        if (managementData) {
            const dataArray = Array.isArray(managementData) ? managementData : [managementData];
            return processRawBets(dataArray);
        }

        if (model.listSession.remoteData.type === 'Success') {
            const data = model.listSession.remoteData.data;

            const fijos = data.fijosCorridos.map(b => ({
                id: b.id || Math.random().toString(),
                type: 'Fijo/Corrido',
                numbers: formatNumbers(b.bet),
                amount: (b.fijoAmount || 0) + (b.corridoAmount || 0),
                fijoAmount: b.fijoAmount,
                corridoAmount: b.corridoAmount
            }));

            const parlets = data.parlets.map(b => ({
                id: b.id || Math.random().toString(),
                type: 'Parlet',
                numbers: b.bets.map(String),
                amount: b.amount || 0
            }));

            const centenas = data.centenas.map(b => ({
                id: b.id || Math.random().toString(),
                type: 'Centena',
                numbers: formatNumbers(b.bet),
                amount: b.amount
            }));

            const loteria = data.loteria.map(b => ({
                id: b.id || Math.random().toString(),
                type: 'Lotería',
                numbers: formatNumbers(b.bet),
                amount: b.amount || 0
            }));

            return [...fijos, ...parlets, ...centenas, ...loteria];
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
            console.log('[useSuccess] handleShare initiated');
            if (!viewShotRef.current?.capture) {
                console.warn('[useSuccess] viewShotRef.current or capture is undefined');
                return;
            }

            const uri = await viewShotRef.current.capture();
            console.log('[useSuccess] Voucher captured successfully:', uri);

            dispatch({ type: 'SUCCESS', payload: { type: SuccessMsgType.SHARE_VOUCHER_REQUESTED, uri } });
        } catch (error) {
            console.error('[useSuccess] Error capturing voucher:', error);
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
