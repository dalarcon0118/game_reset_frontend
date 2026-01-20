import { useMemo, useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { selectBetsModel, selectDispatch, useBetsStore } from '../../core/store';
import { SuccessMsgType } from './success.types';
import ViewShot from 'react-native-view-shot';

export const useSuccess = () => {
    const model = useBetsStore(selectBetsModel);
    const dispatch = useBetsStore(selectDispatch);

    const { betId } = useLocalSearchParams<{ betId: string }>();

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
        const formatNumbers = (numbers_played: any) => {
            console.log('[formatNumbers] input numbers_played:', numbers_played);
            let parsed = numbers_played;
            if (typeof numbers_played === 'string') {
                try {
                    if (numbers_played.startsWith('[') || numbers_played.startsWith('{')) {
                        parsed = JSON.parse(numbers_played);
                    }
                } catch (_e) {
                    parsed = numbers_played;
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

        if (managementData) {
            const dataArray = Array.isArray(managementData) ? managementData : [managementData];

            return dataArray.map(b => {
                const numbers = formatNumbers(b.numbers);
                let displayType: string = b.type;
                if (b.type === 'Fijo' || b.type === 'Corrido') {
                    displayType = 'Fijo/Corrido';
                }

                return {
                    id: b.id,
                    type: displayType,
                    numbers,
                    amount: b.amount || ((b as any).fijoAmount || 0) + ((b as any).corridoAmount || 0),
                };
            });
        }

        if (model.listSession.remoteData.type === 'Success') {
            const data = model.listSession.remoteData.data;

            return [
                ...data.fijosCorridos.map(b => ({ id: b.id || Math.random().toString(), type: 'Fijo/Corrido', numbers: formatNumbers(b.bet), amount: (b.fijoAmount || 0) + (b.corridoAmount || 0) })),
                ...data.parlets.map(b => ({ id: b.id || Math.random().toString(), type: 'Parlet', numbers: b.bets.map(String), amount: b.amount || 0 })),
                ...data.centenas.map(b => ({ id: b.id || Math.random().toString(), type: 'Centena', numbers: formatNumbers(b.bet), amount: b.amount })),
                ...data.loteria.map(b => ({ id: b.id || Math.random().toString(), type: 'Lotería', numbers: formatNumbers(b.bet), amount: b.amount || 0 }))
            ];
        }
        return [];
    }, [managementData, model.listSession.remoteData]);

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
                    type: SuccessMsgType.SHARE_VOUCHER_FAILED,
                    error: 'Error al capturar la imagen del voucher'
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
        totalAmount,
        handleShare,
        handleBack,
        drawId: model.drawId
    };
};
