import { LoteriaBet } from '@/types';
import { LoteriaGroup } from './loteria_column.types';

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

    if (isEditing) {
        return [{ receiptCode: 'local', items: bets }];
    }

    const groups: { [key: string]: LoteriaBet[] } = {};

    bets.forEach(item => {
        const code = item.receiptCode || '-----';
        if (!groups[code]) {
            groups[code] = [];
        }
        groups[code].push(item);
    });

    return Object.entries(groups).map(([receiptCode, items]) => ({
        receiptCode,
        items
    }));
};
