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
        const { draw, bets: rawBets, rewards } = source;

        // 1. Normalize and process bets
        const normalizedBets = SuccessImpl.normalizeBets(rawBets);

        // 2. Filter by receiptCode if provided
        const filteredBets = receiptCode
            ? SuccessImpl.filterByReceiptCode(normalizedBets, receiptCode)
            : normalizedBets;

        // 3. Calculate core values
        const formattedBets = SuccessImpl.processRawBets(filteredBets, []);
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

        // Zero Trust V2: Construir URL de auditoría con datos criptográficos
        // SIEMPRE usar uid+hash+raw cuando estén disponibles (sin importar sync status)
        // El QR debe permitir verificación offline completa
        let auditUrl: string | undefined = undefined;
        const rawPayload = firstBet?.fingerprint?.raw_payload;
        const directUid = firstBet?.ownerUser || firstBet?.owner_user_id;

        let uid = directUid;
        if (!uid && rawPayload) {
            try {
                const payloadObj = JSON.parse(rawPayload);
                uid = payloadObj.uid;
                log.info('🔐 [QR_AUDIT_URL] Extracted uid from raw_payload:', { uid });
            } catch (e) {
                log.warn('🔐 [QR_AUDIT_URL] Failed to parse raw_payload for uid');
            }
        }

        log.info('🔐 [QR_AUDIT_URL] Deciding URL format:', {
            hasFinalReceiptCode: !!finalReceiptCode,
            finalReceiptCode,
            hasFirstFingerprint: !!firstFingerprint,
            hasRawPayload: !!rawPayload,
            rawPayloadLength: rawPayload?.length || 0,
            hasUid: !!uid,
            uid,
            firstBetStatus: firstBet?.status,
            syncContext: firstBet?.syncContext
        });

        // Prioridad: 1) uid+hash+data (base64) > 2) rc (fallback) > 3) hash nomas
        if (firstFingerprint && rawPayload && uid) {
            const encodedPayload = btoa(rawPayload);
            auditUrl = `${serverHost}/public/audit/?uid=${uid}&hash=${firstFingerprint}&data=${encodedPayload}`;
            log.info('🔐 [QR_AUDIT_URL] Generated CRYPTO URL:', { auditUrl: auditUrl.substring(0, 200) });
        } else if (finalReceiptCode && finalReceiptCode !== UI_CONSTANTS.EMPTY_RECEIPT_CODE) {
            auditUrl = `${serverHost}/public/audit/?rc=${finalReceiptCode}`;
            log.info('🔐 [QR_AUDIT_URL] Generated RC FALLBACK URL:', { auditUrl });
        } else if (firstFingerprint) {
            auditUrl = `${serverHost}/public/audit/?hash=${firstFingerprint}`;
            log.info('🔐 [QR_AUDIT_URL] Generated HASH ONLY URL:', { auditUrl });
        }

        const metadata = SuccessImpl.calculateMetadata(draw, firstFingerprint, auditUrl, rewards);

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
     * Calculates voucher metadata based on rewards (enriched by Repository).
     */
    calculateMetadata: (
        draw: any | null,
        fingerprintHash?: string,
        auditUrl?: string,
        rewards?: any[]
    ): VoucherMetadata => {
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

        // rewards ya vienen del BetType correcto (enriquecido por Repository)
        const validRewards = rewards || [];

        let totalPrize = 'Según Reglas';
        const prizeRules: PrizeRule[] = [];

        if (validRewards.length > 0) {
            const principal = validRewards.find((r: any) => r.category === 'principal');
            if (principal) {
                try {
                    totalPrize = new Intl.NumberFormat('es-DO', {
                        style: 'currency', currency: 'DOP', minimumFractionDigits: 2
                    }).format(principal.payout);
                } catch (e) {
                    totalPrize = `DOP ${principal.payout}`;
                }
            }

            validRewards.forEach((r: any) => {
                prizeRules.push({
                    label: r.name,
                    description: r.is_pool ? 'Premio pool' : 'Premio fijo',
                    amount: r.payout
                });
            });
        }

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
    },

    /**
     * Enriches bets with rewards from BetType (Repository layer responsibility).
     * Finds the BetType matching the first bet's typeCode and returns its rewards.
     */
    enrichBetsWithRewards: (bets: any[], betTypes: any[]): any[] => {
        if (!bets?.length || !betTypes?.length) return [];
        
        const firstBet = bets[0];
        const betTypeCode = firstBet?.type || firstBet?.betTypeCode;
        
        if (!betTypeCode) return [];
        
        const matchingBetType = betTypes.find(bt => bt.code === betTypeCode);
        return matchingBetType?.rewards || [];
    }
};
