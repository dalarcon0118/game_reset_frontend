import { VoucherData, FormattedBet, GroupedBets, VoucherMetadata } from './success.types';
import { VoucherSourceData } from './success.ports';
import { getBetVisualSchema, isLoteriaType, BET_TYPE_KEYS, UI_CONSTANTS, normalizeBetType } from '@/shared/types/bet_types';

/**
 * Pure Logic for Success Feature
 */
export const SuccessImpl = {
    /**
     * Main transformation from raw source data to domain DTO
     */
    toVoucherData: (source: VoucherSourceData, receiptCode?: string): VoucherData => {
        const { draw, bets: rawBets, betTypes } = source;

        // 1. Normalize and process bets
        const normalizedBets = SuccessImpl.normalizeBets(rawBets);

        // 2. Filter by receiptCode if provided
        const filteredBets = receiptCode
            ? SuccessImpl.filterByReceiptCode(normalizedBets, receiptCode)
            : normalizedBets;

        // 3. Calculate core values
        const formattedBets = SuccessImpl.processRawBets(filteredBets, betTypes);
        const totalAmount = SuccessImpl.calculateTotalAmount(formattedBets);
        const isBolita = SuccessImpl.isBolitaLayout(formattedBets);
        const groupedBets = isBolita ? SuccessImpl.groupBetsForBolita(formattedBets) : null;

        // 4. Resolve final receipt code
        const finalReceiptCode = receiptCode || formattedBets[0]?.receiptCode || UI_CONSTANTS.EMPTY_RECEIPT_CODE;

        // 5. Calculate metadata
        const metadata = SuccessImpl.calculateMetadata(draw);

        return {
            drawId: draw?.id || null,
            receiptCode: finalReceiptCode,
            bets: formattedBets,
            totalAmount,
            metadata,
            isBolita,
            groupedBets
        };
    },

    /**
     * Processes raw bets from various sources into a unified formatted structure.
     */
    processRawBets: (data: any[], betTypes?: any[]): FormattedBet[] => {
        const groupedFijosCorridos = new Map<string, any>();
        const otherBets: FormattedBet[] = [];

        data.forEach((b: any, index: number) => {
            if (!b) return;

            // El tipo de apuesta ya viene normalizado desde el repositorio/flow.
            // Solo aplicamos un fallback de seguridad.
            const displayType = normalizeBetType(b.type || b.betTypeCode || b.betTypeId || '');
            const betTypeId = b.betTypeId || b.betTypeid || b.bet_type_id || b.bet_type;

            const type = typeof displayType === 'string' ? displayType.toLowerCase() : '';
            const numbers = SuccessImpl.formatBetVisuals(displayType, b.numbers || b.bet || b.bets);
            const receiptCode = b.receiptCode || b.receipt_code;

            const isFijoCorrido = type === BET_TYPE_KEYS.FIJO.toLowerCase() ||
                type === BET_TYPE_KEYS.CORRIDO.toLowerCase() ||
                displayType === BET_TYPE_KEYS.FIJO_CORRIDO ||
                displayType === BET_TYPE_KEYS.FIJO ||
                displayType === BET_TYPE_KEYS.CORRIDO;

            if (isFijoCorrido) {
                const numStr = numbers[0];
                if (!numStr) return;

                const existing = groupedFijosCorridos.get(numStr) || {
                    id: b.id || `${UI_CONSTANTS.OFFLINE_ID_PREFIX}-fijo-corrido-${numStr}`,
                    type: BET_TYPE_KEYS.FIJO_CORRIDO,
                    numbers: [numStr],
                    amount: 0,
                    fijoAmount: 0,
                    corridoAmount: 0,
                    receiptCode,
                    betTypeId
                };

                const fijo = Number(b.fijoAmount || (type === BET_TYPE_KEYS.FIJO.toLowerCase() || displayType === BET_TYPE_KEYS.FIJO ? b.amount : 0));
                const corrido = Number(b.corridoAmount || (type === BET_TYPE_KEYS.CORRIDO.toLowerCase() || displayType === BET_TYPE_KEYS.CORRIDO ? b.amount : 0));

                existing.fijoAmount += fijo;
                existing.corridoAmount += corrido;
                existing.amount = existing.fijoAmount + existing.corridoAmount;

                groupedFijosCorridos.set(numStr, existing);
            } else {
                const isCentena = displayType === BET_TYPE_KEYS.CENTENA ||
                    (typeof displayType === 'string' && displayType.toLowerCase().includes(BET_TYPE_KEYS.CENTENA.toLowerCase()));

                const isLoteriaVoucher = isLoteriaType(displayType, betTypeId);

                otherBets.push({
                    id: b.id || `${displayType}-${index}`,
                    type: displayType,
                    numbers: (isCentena || isLoteriaVoucher) ? [numbers.join('')] : numbers,
                    amount: Number(b.amount || 0),
                    fijoAmount: 0,
                    corridoAmount: 0,
                    receiptCode,
                    betTypeId
                });
            }
        });

        return [...Array.from(groupedFijosCorridos.values()), ...otherBets];
    },

    /**
     * Formats numbers based on bet type for visual representation (circles).
     * Uses centralized bet types from @/shared/types/bet_types
     */
    formatBetVisuals: (type: string, numbers: any): string[] => {
        // Use centralized schema getter (handles normalization automatically)
        const pattern = getBetVisualSchema(type);

        // Extract raw input
        let rawInput = numbers;

        if (typeof numbers === 'object' && numbers !== null) {
            rawInput = numbers.number || numbers.numbers || Object.values(numbers)[0];
        }

        const digits = String(rawInput || '').replace(/\D/g, '');
        if (!digits) return [];

        if (pattern === 'pairs-from-right') {
            const matches = digits.match(/.{1,2}(?=(.{2})*$)/g);
            return matches || [digits];
        }

        let result: string[] = [];
        let current = digits;
        const reversedPattern = [...pattern].reverse();

        for (const len of reversedPattern) {
            if (current.length === 0) break;
            result.unshift(current.slice(-len));
            current = current.slice(0, -len);
        }

        if (current.length > 0) result.unshift(current);
        return result.filter(Boolean);
    },

    calculateMetadata: (draw: any | null): VoucherMetadata => {
        const now = new Date();
        const issueDate = now.toLocaleDateString(UI_CONSTANTS.DEFAULT_LOCALE, {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        const awardDate = draw?.draw_datetime
            ? new Date(draw.draw_datetime).toLocaleDateString(UI_CONSTANTS.DEFAULT_LOCALE, {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            })
            : 'Pendiente';

        let totalPrize = 'Según Reglas';

        const getExtraDataValue = (obj: any, key: string) => {
            if (!obj) return undefined;
            let data = obj;
            if (typeof obj === 'string') {
                try { data = JSON.parse(obj); } catch (e) { return undefined; }
            }
            return data[key];
        };

        const jackpot = getExtraDataValue(draw?.extra_data, 'jackpot_amount') ||
            getExtraDataValue(draw?.draw_type_details?.extra_data, 'jackpot_amount');

        const currency = getExtraDataValue(draw?.extra_data, 'currency') || 'DOP';

        if (jackpot) {
            try {
                const amount = Number(jackpot);
                if (!isNaN(amount)) {
                    totalPrize = new Intl.NumberFormat('es-DO', {
                        style: 'currency', currency, minimumFractionDigits: 2
                    }).format(amount);
                }
            } catch (e) {
                totalPrize = `${currency} ${jackpot}`;
            }
        }

        return {
            issueDate,
            awardDate,
            totalPrize,
            disclaimer: 'Este comprobante contiene los números de premiación, es personal e intransferible...'
        };
    },

    calculateTotalAmount: (bets: FormattedBet[]): number =>
        bets.reduce((acc, curr) => acc + (curr.amount || 0), 0),

    isBolitaLayout: (bets: FormattedBet[]): boolean =>
        bets.some(b => b.type === BET_TYPE_KEYS.FIJO || b.type === BET_TYPE_KEYS.FIJO_CORRIDO || b.type === BET_TYPE_KEYS.PARLET || b.type === BET_TYPE_KEYS.CENTENA),

    groupBetsForBolita: (bets: FormattedBet[]): GroupedBets => ({
        fijosCorridos: bets.filter(b => b.type === BET_TYPE_KEYS.FIJO_CORRIDO),
        parlets: bets.filter(b => b.type === BET_TYPE_KEYS.PARLET),
        centenas: bets.filter(b => b.type === BET_TYPE_KEYS.CENTENA),
    }),

    normalizeBets: (sourceData: any): any[] => {
        if (!sourceData) return [];
        if (Array.isArray(sourceData)) return sourceData;

        const normalized: any[] = [];
        const categories = [UI_CONSTANTS.FIJO_LABEL + 'sCorridos', UI_CONSTANTS.PARLET_LABEL + 's', UI_CONSTANTS.CENTENA_LABEL + 'as', UI_CONSTANTS.LOTERIA_LABEL];

        categories.forEach(cat => {
            if (sourceData[cat] && Array.isArray(sourceData[cat])) {
                sourceData[cat].forEach((b: any) => normalized.push({
                    ...b,
                    type: cat === UI_CONSTANTS.LOTERIA_LABEL ? BET_TYPE_KEYS.LOTERIA :
                        cat === (UI_CONSTANTS.FIJO_LABEL + 'sCorridos') ? BET_TYPE_KEYS.FIJO_CORRIDO :
                            cat === (UI_CONSTANTS.PARLET_LABEL + 's') ? BET_TYPE_KEYS.PARLET : BET_TYPE_KEYS.CENTENA
                }));
            }
        });

        return normalized.length > 0 ? normalized : [sourceData];
    },

    filterByReceiptCode: (bets: any[], receiptCode: string): any[] => {
        if (!receiptCode || receiptCode === UI_CONSTANTS.EMPTY_RECEIPT_CODE) return bets;
        return bets.filter(b => (b.receiptCode || b.receipt_code) === receiptCode);
    }
};
