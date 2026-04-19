import { BetType, Reward } from '@/shared/repositories/draw/api/types/types';
import { PrizeTableCardProps, PrizeTag } from '../screen/components/PrizeTableCard';

/**
 * 🎯 MAPPERS PARA DATOS DE PREMIOS
 * Convierte datos del backend a props de componentes UI.
 */

/**
 * Convierte el valor de payout a formato legible (ej: 500000 -> "500,000x")
 */
const formatPayout = (payout: number): string => {
    return `${payout.toLocaleString('en-US')}x`;
};

/**
 * Determina el tipo de tag basado en propiedades del reward
 */
const getRewardTagType = (reward: Reward): PrizeTag => {
    if (reward.is_pool) {
        return { text: 'Pool', type: 'pool' };
    }
    return { text: '[Fijo]', type: 'fixed' };
};

/**
 * Determina el icono basado en el nombre del bet type
 */
const getIconForBetType = (betTypeName: string): 'trophy' | 'star' | 'award' => {
    const name = betTypeName.toLowerCase();
    if (name.includes('principal') || name.includes('jackpot') || name.includes('mayor')) {
        return 'trophy';
    }
    if (name.includes('centena') || name.includes('5 dígitos') || name.includes('cinco')) {
        return 'star';
    }
    return 'award';
};

/**
 * 🔄 MAPEO PRINCIPAL: BetType -> PrizeTableCardProps
 * Transforma los datos del backend (BetType con rewards) 
 * a props para el componente PrizeTableCard.
 */
export const mapBetTypeToPrizeCard = (betType: BetType, mainReward?: Reward): PrizeTableCardProps => {
    // Usar el primer reward disponible o crear uno por defecto
    const reward = mainReward || betType.rewards?.[0];
    
    if (!reward) {
        return {
            title: betType.name,
            multiplier: 'N/A',
            tags: [],
            icon: 'award'
        };
    }

    const tags: PrizeTag[] = [
        getRewardTagType(reward),
        ...(betType.rewards && betType.rewards.length > 1 
            ? [{ text: `+${betType.rewards.length - 1}`, type: 'secondary' as const }] 
            : [])
    ];

    return {
        title: reward.name || betType.name,
        multiplier: formatPayout(reward.payout),
        tags,
        icon: getIconForBetType(betType.name),
        description: betType.description
    };
};

/**
 * 🔄 MAPEO DE ARRAY: BetType[] -> PrizeTableCardProps[]
 * Convierte todos los bet types con premios al formato de cards.
 */
export const mapBetTypesToPrizeCards = (betTypes: BetType[]): PrizeTableCardProps[] => {
    return betTypes
        .filter(bt => bt.rewards && bt.rewards.length > 0)
        .map(bt => mapBetTypeToPrizeCard(bt))
        .sort((a, b) => {
            // Ordenar por payout descendente (premios más grandes primero)
            const payoutA = parseInt(a.multiplier.replace(/[^0-9]/g, '')) || 0;
            const payoutB = parseInt(b.multiplier.replace(/[^0-9]/g, '')) || 0;
            return payoutB - payoutA;
        });
};
