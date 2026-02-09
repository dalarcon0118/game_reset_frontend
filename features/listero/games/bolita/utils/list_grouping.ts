
export interface GroupedBets {
    [receiptCode: string]: {
        fijosCorridos: any[];
        parlets: any[];
        centenas: any[];
    };
}

export const groupBetsByReceipt = (
    fijosCorridos: any[],
    parlets: any[],
    centenas: any[]
): GroupedBets => {
    const groups: GroupedBets = {};

    const addToGroup = (receiptCode: string | undefined, type: 'fijosCorridos' | 'parlets' | 'centenas', item: any) => {
        const code = receiptCode || '-----';
        if (!groups[code]) {
            groups[code] = { fijosCorridos: [], parlets: [], centenas: [] };
        }
        groups[code][type].push(item);
    };

    if (Array.isArray(fijosCorridos)) {
        fijosCorridos.forEach((item: any) => addToGroup(item.receiptCode, 'fijosCorridos', item));
    }
    
    if (Array.isArray(parlets)) {
        parlets.forEach((item: any) => addToGroup(item.receiptCode, 'parlets', item));
    }
    
    if (Array.isArray(centenas)) {
        centenas.forEach((item: any) => addToGroup(item.receiptCode, 'centenas', item));
    }

    return groups;
};
