import { BetType } from '@/types';
import { BackendBet } from './types';

export const mapBackendBetToFrontend = (backendBet: BackendBet): BetType => {
    try {
        console.log('Mapping backend bet:', JSON.stringify(backendBet, null, 2));

        // Determinar el tipo de apuesta
        const gameTypeName = backendBet.game_type_details?.name;
        const betTypeName = backendBet.bet_type_details?.name;
        const rawType = gameTypeName || betTypeName || 'Unknown';

        // Mapear a tipos válidos para el frontend
        let mappedType: 'Fijo' | 'Parlet' | 'Corrido' | 'Centena' | 'Loteria' | 'Cuaterna Semanal';
        const lowerType = rawType.toLowerCase();

        if (lowerType.includes('fijo')) {
            mappedType = 'Fijo';
        } else if (lowerType.includes('parlet')) {
            mappedType = 'Parlet';
        } else if (lowerType.includes('corrido')) {
            mappedType = 'Corrido';
        } else if (lowerType.includes('centena')) {
            mappedType = 'Centena';
        } else if (lowerType.includes('loteria') || lowerType.includes('lotería')) {
            mappedType = 'Loteria';
        } else if (lowerType.includes('cuaterna')) {
            mappedType = 'Cuaterna Semanal';
        } else {
            // Fallback: intentar inferir del código o nombre
            const code = backendBet.bet_type_details?.code?.toLowerCase() || '';
            if (code.includes('fijo')) mappedType = 'Fijo';
            else if (code.includes('parlet')) mappedType = 'Parlet';
            else if (code.includes('corrido')) mappedType = 'Corrido';
            else if (code.includes('centena')) mappedType = 'Centena';
            else if (code.includes('loteria')) mappedType = 'Loteria';
            else if (code.includes('cuaterna')) mappedType = 'Cuaterna Semanal';
            else mappedType = 'Fijo'; // Default a Fijo si no podemos determinar
        }

        console.log(`Mapping bet ID ${String(backendBet.id)}: game_type=${gameTypeName}, bet_type=${betTypeName}, rawType=${rawType}, mappedType=${mappedType}`);

        return {
            id: (backendBet.id || backendBet.receipt_code || Math.random().toString(36).substring(7)).toString(),
            type: mappedType,
            numbers: JSON.stringify(backendBet.numbers_played),
            amount: backendBet.amount ? parseFloat(backendBet.amount.toString()) : 0,
            draw: backendBet.draw?.toString() || '',
            createdAt: backendBet.created_at ? new Date(backendBet.created_at).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            }) : new Date().toLocaleTimeString(),
            receiptCode: backendBet.receipt_code || '-----'
        };
    } catch (error) {
        console.error('Error mapping bet:', error, backendBet);
        throw error;
    }
};
