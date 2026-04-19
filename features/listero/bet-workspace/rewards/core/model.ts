import { WinningRecord } from '@/types';
import { UnifiedRulesResponse } from '@/shared/services/rules';
import { WinningBet } from '@/shared/repositories/bet/winnings.types';
import { BetType } from '@/shared/repositories/draw/api/types/types';
import { WebData, RemoteData } from '@core/tea-utils';

/**
 * 📊 REWARDS MODEL
 * Sigue la arquitectura TEA con RemoteData para estados de carga.
 */
export interface RewardsModel {
    /** Premios generales del sorteo */
    rewards: {
        status: WebData<WinningRecord | null>;
    };
    /** Reglas del sorteo */
    rules: {
        status: WebData<UnifiedRulesResponse | null>;
    };
    /** Tipos de apuesta con información de premios (del backend) */
    betTypes: {
        status: WebData<BetType[]>;
    };
    /** Apuestas ganadoras del usuario */
    userWinnings: {
        status: WebData<WinningBet[]>;
    };
    /** ID del sorteo actual */
    currentDrawId: string | null;
    /** Título del sorteo */
    drawTitle: string | null;
    /** Tasa de comisión por defecto para cálculos financieros */
    defaultCommissionRate?: number;
}

export const initialRewardsModel: RewardsModel = {
    rewards: {
        status: RemoteData.notAsked(),
    },
    rules: {
        status: RemoteData.notAsked(),
    },
    betTypes: {
        status: RemoteData.notAsked(),
    },
    userWinnings: {
        status: RemoteData.notAsked(),
    },
    currentDrawId: null,
    drawTitle: null,
};
