import { IRewardsUIService } from './adapters';
import { WinningRecord } from './types';
import { UnifiedRulesResponse } from '@/shared/services/rules';
import { WinningBet } from '@/shared/repositories/bet/winnings.types';
import { winningsRepository } from '@/shared/repositories/bet/winnings.repository';
import { rulesRepository } from '@/shared/repositories/rules';
import { drawRepository } from '@/shared/repositories/draw';
import { logger } from '@/shared/utils/logger';
import { WebData } from '@/shared/core/tea-utils/remote.data';
import {
    FETCH_REWARDS_SUCCEEDED,
    FETCH_RULES_SUCCEEDED,
    FETCH_USER_WINNINGS_SUCCEEDED,
    RewardsMsg
} from './types';
import { Cmd } from '@/shared/core';
import { RemoteDataHttp } from '@/shared/core/tea-utils';

const log = logger.withTag('REWARDS_SERVICE');

export interface IRewardsDataService {
    fetchDrawRewards(drawId: string): Cmd;
    fetchDrawRules(drawId: string): Cmd;
    fetchUserWinnings(drawId: string): Cmd;
}

/**
 * 🛠️ REWARDS DATA SERVICE IMPLEMENTATION
 * Orquesta los efectos secundarios (API) a través de Repositorios,
 * devolviendo Comandos de TEA. Cumple con SRP al no acceder a la API directamente.
 */


export class RewardsDataService implements IRewardsDataService {
    fetchDrawRewards(drawId: string): Cmd {
        return RemoteDataHttp.fetch<WinningRecord | null, RewardsMsg>(
            async () => {
                const result = await drawRepository.getWinningRecord(drawId);
                return result.isOk() ? result.value : null;
            },
            (webData: WebData<WinningRecord | null>) => FETCH_REWARDS_SUCCEEDED(webData)
        );
    }

    fetchDrawRules(drawId: string): Cmd {
        return RemoteDataHttp.fetch<UnifiedRulesResponse | null, RewardsMsg>(
            () => rulesRepository.getAllRulesForDraw(drawId),
            (webData: WebData<UnifiedRulesResponse | null>) => FETCH_RULES_SUCCEEDED(webData)
        );
    }

    fetchUserWinnings(drawId: string): Cmd {
        return RemoteDataHttp.fetch<WinningBet[], RewardsMsg>(
            () => winningsRepository.getMyWinningsByDraw(drawId),
            (webData: WebData<WinningBet[]>) => FETCH_USER_WINNINGS_SUCCEEDED(webData)
        );
    }
}

/**
 * 🎨 REWARDS UI SERVICE IMPLEMENTATION
 * Implementación concreta del contrato de UI.
 */
export class RewardsUIService implements IRewardsUIService {
    showError(message: string): void {
        Cmd.alert({ title: 'Error', message });
    }

    goBack(): void {
        // Implementación de navegación se inyectará si es necesario
        log.debug('UI Service: goBack called');
    }

    logEvent(name: string, params?: any): void {
        log.debug(`UI Event: ${name}`, params);
    }
}
