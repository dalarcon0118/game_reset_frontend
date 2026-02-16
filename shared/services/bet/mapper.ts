import { BetType } from '@/types';
import { BackendBet } from './types';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('BET_MAPPER');

export const mapBackendBetToFrontend = (backendBet: BackendBet): BetType => {
    try {
        log.debug('Mapping backend bet', { backendBet });

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

        log.debug(`Mapping bet result`, {
            id: backendBet.id,
            game_type: gameTypeName,
            bet_type: betTypeName,
            rawType,
            mappedType
        });

        // Extraer números de forma limpia (evitar JSON string si es posible)
        let cleanNumbers: string;
        const rawNumbers = backendBet.numbers_played;

        if (typeof rawNumbers === 'string') {
            try {
                const parsed = JSON.parse(rawNumbers);
                if (typeof parsed === 'object' && parsed !== null) {
                    cleanNumbers = parsed.number || parsed.bet || JSON.stringify(parsed);
                } else {
                    cleanNumbers = String(parsed);
                }
            } catch {
                cleanNumbers = rawNumbers;
            }
        } else if (typeof rawNumbers === 'object' && rawNumbers !== null) {
            // Manejar formato {"number": "054"} o {"bet": 54} o {"numbers": [12, 34]}
            const val = (rawNumbers as any).number || (rawNumbers as any).bet || (rawNumbers as any).numbers;
            if (val !== undefined) {
                cleanNumbers = Array.isArray(val) ? val.join('-') : String(val);
            } else {
                cleanNumbers = JSON.stringify(rawNumbers);
            }
        } else {
            cleanNumbers = String(rawNumbers);
        }

        // Eliminar ceros a la izquierda solo para tipos que no son Centena o Loteria
        if (mappedType === 'Fijo' || mappedType === 'Corrido' || mappedType === 'Parlet') {
            if (cleanNumbers.includes('-')) {
                cleanNumbers = cleanNumbers.split('-').map(n => parseInt(n, 10).toString()).join('-');
            } else if (!isNaN(parseInt(cleanNumbers, 10))) {
                cleanNumbers = parseInt(cleanNumbers, 10).toString();
            }
        }

        return {
            id: (backendBet.id || backendBet.receipt_code || Math.random().toString(36).substring(7)).toString(),
            type: mappedType,
            numbers: cleanNumbers,
            amount: backendBet.amount ? parseFloat(backendBet.amount.toString()) : 0,
            draw: backendBet.draw?.toString() || '',
            createdAt: backendBet.created_at ? new Date(backendBet.created_at).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            }) : new Date().toLocaleTimeString(),
            receiptCode: backendBet.receipt_code || '-----'
        };
    } catch (error) {
        log.error('Error mapping bet', error, { backendBet });
        throw error;
    }
};
