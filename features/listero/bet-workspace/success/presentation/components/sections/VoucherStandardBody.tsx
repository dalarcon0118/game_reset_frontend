import React from 'react';
import { FormattedBet } from '../../../core/domain/success.types';
import { BetRow } from '../parts/BetRow';

const isLoteriaBet = (betType: string): boolean => {
    const normalized = betType.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return normalized.includes('loteria') || normalized.includes('cuaterna');
};

interface VoucherStandardBodyProps {
    bets: FormattedBet[];
}

export const VoucherStandardBody: React.FC<VoucherStandardBodyProps> = ({ bets }) => {
    const nonLoteriaBets = bets.filter(b => !isLoteriaBet(b.type));

    return (
        <>
            {nonLoteriaBets.map((bet, index) => (
                <BetRow key={bet.id || index} bet={bet} />
            ))}
        </>
    );
};