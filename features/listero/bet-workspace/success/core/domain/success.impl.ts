import { VoucherData, FormattedBet, GroupedBets, VoucherMetadata, PrizeRule } from './success.types';
import { VoucherSourceData } from './success.ports';
import { getBetVisualSchema, isLoteriaType, BET_TYPE_KEYS, UI_CONSTANTS, normalizeBetType } from '@/shared/types/bet_types';
import { settings } from '@/config/settings';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('SUCCESS_IMPL');

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
        const firstBet = rawBets[0] as any;

        log.info('🔍 [FINGERPRINT_DEBUG] firstBet raw structure:', {
            id: firstBet?.id,
            receiptCode: firstBet?.receiptCode,
            hasFingerprint: !!firstBet?.fingerprint,
            hasFingerprintData: !!firstBet?.fingerprint_data,
            fingerprintKeys: firstBet?.fingerprint ? Object.keys(firstBet.fingerprint) : [],
            fingerprintDataKeys: firstBet?.fingerprint_data ? Object.keys(firstBet.fingerprint_data) : [],
            fingerprint: firstBet?.fingerprint,
            fingerprint_data: firstBet?.fingerprint_data
        });

        const firstFingerprint =
            firstBet?.fingerprint?.hash ||
            firstBet?.fingerprint_data?.hash ||
            firstBet?.fingerprint_hash ||
            firstBet?.metadata?.fingerprint_hash;

        log.info('🔍 [FINGERPRINT] Lookup result:', {
            firstFingerprint: firstFingerprint ? 'PRESENT' : 'MISSING',
            fingerprintValue: firstFingerprint,
            checkedPaths: [
                'firstBet?.fingerprint?.hash',
                'firstBet?.fingerprint_data?.hash',
                'firstBet?.fingerprint_hash',
                'firstBet?.metadata?.fingerprint_hash'
            ]
        });

        // FASE 5: Construir URL de auditoría pública usando la URL base de settings
        const serverHost = settings.api.baseUrl.replace(/\/api$/, '');

        // Zero Trust V2: Construir URL con parámetros para validación offline
        let auditUrl: string | undefined = undefined;
        if (firstFingerprint) {
            const uid = firstBet?.ownerUser || firstBet?.owner_user_id;
            const amt = Number(firstBet?.amount || 0).toFixed(2);
            const balRaw = firstBet?.fingerprint?.total_sales || firstBet?.total_sales || firstBet?.fingerprint_data?.total_sales;
            const bal = Number(balRaw || 0).toFixed(2);

            // Si tenemos los datos mínimos, creamos la URL extendida para auditoría offline
            if (uid && firstBet?.amount && balRaw) {
                auditUrl = `${serverHost}/audit/?uid=${uid}&hash=${firstFingerprint}&amt=${amt}&bal=${bal}`;
            } else {
                // Fallback a la URL simple por hash
                auditUrl = `${serverHost}/audit/?hash=${firstFingerprint}`;
            }
        }

        const metadata = SuccessImpl.calculateMetadata(draw, firstFingerprint, auditUrl);

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
                otherBets.push({
                    id: b.id || `${UI_CONSTANTS.OFFLINE_ID_PREFIX}-${index}`,
                    type: displayType,
                    numbers,
                    amount: Number(b.amount || 0),
                    receiptCode,
                    betTypeId
                });
            }
        });

        return [...Array.from(groupedFijosCorridos.values()), ...otherBets];
    },

    /**
     * Groups formatted bets into a Bolita layout if applicable.
     */
    groupBetsForBolita: (bets: FormattedBet[]): GroupedBets => {
        const loteria: FormattedBet[] = [];
        const fijosCorridos: FormattedBet[] = [];
        const parlets: FormattedBet[] = [];
        const centenas: FormattedBet[] = [];

        bets.forEach(b => {
            if (isLoteriaType(b.type)) {
                loteria.push(b);
            } else if (b.type === BET_TYPE_KEYS.FIJO_CORRIDO || b.type === BET_TYPE_KEYS.FIJO || b.type === BET_TYPE_KEYS.CORRIDO) {
                fijosCorridos.push(b);
            } else if (b.type === BET_TYPE_KEYS.PARLET) {
                parlets.push(b);
            } else if (b.type === BET_TYPE_KEYS.CENTENA) {
                centenas.push(b);
            }
        });

        return { loteria, fijosCorridos, parlets, centenas };
    },

    /**
     * Determines if the bets should be displayed in a Bolita layout.
     */
    isBolitaLayout: (bets: FormattedBet[]): boolean => {
        return bets.some(b =>
            isLoteriaType(b.type) ||
            b.type === BET_TYPE_KEYS.FIJO_CORRIDO ||
            b.type === BET_TYPE_KEYS.FIJO ||
            b.type === BET_TYPE_KEYS.CORRIDO ||
            b.type === BET_TYPE_KEYS.PARLET ||
            b.type === BET_TYPE_KEYS.CENTENA
        );
    },

    /**
     * Calculates the total amount from formatted bets.
     */
    calculateTotalAmount: (bets: FormattedBet[]): number => {
        return bets.reduce((sum, b) => sum + b.amount, 0);
    },

    /**
     * Calculates voucher metadata based on draw info.
     */
    calculateMetadata: (draw: any | null, fingerprintHash?: string, auditUrl?: string): VoucherMetadata => {
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

        const prizeConfig = draw?.prize_config;

        console.log('[SUCCESS_DEBUG] calculateMetadata called with:', {
            drawId: draw?.id,
            drawName: draw?.name,
            hasPrizeConfig: !!prizeConfig,
            prizeConfigValue: prizeConfig,
            drawAllKeys: draw ? Object.keys(draw) : [],
            extraData: draw?.extra_data
        });

        let totalPrize = 'Según Reglas';
        const prizeRules: PrizeRule[] = [];

        if (prizeConfig) {
            const { main_prize, currency = 'DOP', secondary_rules = [] } = prizeConfig;

            if (main_prize) {
                try {
                    const amount = Number(main_prize);
                    if (!isNaN(amount)) {
                        totalPrize = new Intl.NumberFormat('es-DO', {
                            style: 'currency', currency, minimumFractionDigits: 2
                        }).format(amount);
                    } else {
                        totalPrize = `${currency} ${main_prize}`;
                    }
                } catch (e) {
                    totalPrize = `${currency} ${main_prize}`;
                }
            }

            if (Array.isArray(secondary_rules)) {
                secondary_rules.forEach((rule: any) => {
                    if (rule.label && rule.description) {
                        prizeRules.push({
                            label: String(rule.label),
                            description: String(rule.description)
                        });
                    }
                });
            }
        }

        console.log('[SUCCESS_DEBUG] calculateMetadata result:', { totalPrize, prizeRules });

        return {
            issueDate,
            awardDate,
            totalPrize,
            prizeRules,
            disclaimer: 'Este comprobante contiene los números de premiación, es personal e intransferible...',
            fingerprintHash,
            auditUrl
        };
    },

    /**
     * Formats bet numbers for visual display based on type.
     */
    formatBetVisuals: (type: string, numbers: any): string[] => {
        const schema = getBetVisualSchema(type);
        if (!schema) return Array.isArray(numbers) ? numbers.map(String) : [String(numbers)];

        const nums = Array.isArray(numbers) ? numbers : [numbers];

        // Zero Trust: Asegurar padding consistente según el schema
        const totalDigits = Array.isArray(schema)
            ? schema.reduce((a, b) => a + b, 0)
            : 2;

        return nums.map(n => String(n).padStart(totalDigits, '0'));
    },

    /**
     * Filters normalized bets by receipt code.
     */
    filterByReceiptCode: (bets: any[], code: string): any[] => {
        return bets.filter(b => (b.receiptCode || b.receipt_code) === code);
    },

    /**
     * Normalizes raw bets from various sources.
     */
    normalizeBets: (bets: any): any[] => {
        if (!bets) return [];
        if (Array.isArray(bets)) return bets;
        // Si es un objeto con arrays de tipos (formato antiguo/específico)
        const all: any[] = [];
        Object.values(bets).forEach(val => {
            if (Array.isArray(val)) all.push(...val);
        });
        return all;
    }
};
