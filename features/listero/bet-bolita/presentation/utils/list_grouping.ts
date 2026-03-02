import { FijosCorridosBet, ParletBet, CentenaBet } from '@/types';

export interface GroupedBets {
    [receiptCode: string]: {
        fijosCorridos: FijosCorridosBet[];
        parlets: ParletBet[];
        centenas: CentenaBet[];
    };
}

export const groupBetsByReceipt = (
    fijosCorridos: FijosCorridosBet[],
    parlets: ParletBet[],
    centenas: CentenaBet[]
): GroupedBets => {
    const groups: GroupedBets = {};

    const addToGroup = <T extends { receiptCode?: string }>(
        type: 'fijosCorridos' | 'parlets' | 'centenas',
        item: T
    ) => {
        const code = item.receiptCode || '-----';
        if (!groups[code]) {
            groups[code] = { fijosCorridos: [], parlets: [], centenas: [] };
        }
        (groups[code][type] as T[]).push(item);
    };

    if (Array.isArray(fijosCorridos)) {
        fijosCorridos.forEach((item) => addToGroup('fijosCorridos', item));
    }

    if (Array.isArray(parlets)) {
        parlets.forEach((item) => addToGroup('parlets', item));
    }

    if (Array.isArray(centenas)) {
        centenas.forEach((item) => addToGroup('centenas', item));
    }

    return groups;
};
