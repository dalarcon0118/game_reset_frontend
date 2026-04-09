import { LoteriaBet } from '@/types';
import { LoteriaGroup } from './loteria_column.types';

const toNumberOrNull = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return null;
};

const toTimestamp = (bet: LoteriaBet): number => {
    const source = (bet as unknown as { createdAt?: string; timestamp?: string; updatedAt?: string });
    const raw = source.createdAt || source.timestamp || source.updatedAt;
    if (!raw) return 0;
    const time = new Date(raw).getTime();
    return Number.isFinite(time) ? time : 0;
};

const compareBetsDesc = (a: LoteriaBet, b: LoteriaBet): number => {
    const timeDiff = toTimestamp(b) - toTimestamp(a);
    if (timeDiff !== 0) return timeDiff;

    const idDiff = (toNumberOrNull(b.id) ?? Number.MIN_SAFE_INTEGER) - (toNumberOrNull(a.id) ?? Number.MIN_SAFE_INTEGER);
    if (idDiff !== 0) return idDiff;

    const betDiff = (toNumberOrNull(b.bet) ?? Number.MIN_SAFE_INTEGER) - (toNumberOrNull(a.bet) ?? Number.MIN_SAFE_INTEGER);
    if (betDiff !== 0) return betDiff;

    return String(b.id).localeCompare(String(a.id));
};

/**
 * Agrupa las apuestas de lotería por código de recibo.
 * Si isEditing es true, todas las apuestas se agrupan bajo el código 'local'.
 * 
 * @param bets Lista de apuestas de lotería.
 * @param isEditing Indica si el componente está en modo edición.
 * @returns Lista de grupos de apuestas.
 */
export const groupBetsByReceipt = (bets: LoteriaBet[], isEditing: boolean): LoteriaGroup[] => {
    // DEBUG: Log input
    console.log('[groupBetsByReceipt DEBUG]:', {
        betsCount: bets?.length || 0,
        firstBet: bets?.[0],
        isEditing
    });

    if (!bets || bets.length === 0) {
        return [];
    }

    if (isEditing) {
        return [{ receiptCode: 'local', items: [...bets].sort(compareBetsDesc) }];
    }

    const groups: { [key: string]: LoteriaBet[] } = {};

    bets.forEach(item => {
        const code = item.receiptCode || '-----';
        if (!groups[code]) {
            groups[code] = [];
        }
        groups[code].push(item);
    });

    // Ordenar tambien los grupos de recibos, el grupo mas nuevo primero
    return Object.entries(groups)
        .map(([receiptCode, items]) => ({ receiptCode, items: [...items].sort(compareBetsDesc) }))
        .sort((groupA, groupB) => compareBetsDesc(groupA.items[0], groupB.items[0]));
};
