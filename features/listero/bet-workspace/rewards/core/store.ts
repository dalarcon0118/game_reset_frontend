import { createTEAModule, defineTeaModule } from '@core/engine/tea_module';
import { Sub, Cmd, ret } from '@core/tea-utils';
import { RewardsModel, initialRewardsModel } from './model';
import { RewardsMsg, INIT_MODULE } from './types';
import { makeUpdate } from './update';
import { IRewardsDataService, IRewardsUIService } from './adapters';
import { RewardsDataService, RewardsUIService } from './service';

// Importaciones de dependencias concretas para el Composition Root
import { drawRepository } from '@/shared/repositories/draw';
import { winningsRepository } from '@/shared/repositories/bet/winnings.repository';
import { rulesRepository } from '@/shared/repositories/rules';

/**
 * 📦 COMPOSITION ROOT
 * Instanciación de servicios y dependencias fuera del ciclo de vida de React/Zustand.
 */
const defaultDataService = new RewardsDataService();
const defaultUIService = new RewardsUIService();

/**
 * 📦 REWARDS MODULE DEFINITION
 * Implementa Composición Root e Inyección de Dependencias.
 */

export interface RewardsModuleParams {
    drawId: string;
    title?: string;
    // Inyección opcional de servicios para testing o overrides
    dataService?: IRewardsDataService;
    uiService?: IRewardsUIService;
}

const rewardsDefinition = defineTeaModule<RewardsModel, RewardsMsg>({
    name: 'RewardsModule',
    initial: (params?: any) => {
        const p = params as RewardsModuleParams;
        const model = {
            ...initialRewardsModel,
            currentDrawId: p?.drawId || '',
            drawTitle: p?.title || null
        };

        const drawId = p?.drawId;
        const title = p?.title;

        return ret(model, drawId ? Cmd.ofMsg(INIT_MODULE({ drawId, title })) : Cmd.none);
    },
    update: (model, msg) => {
        return makeUpdate(defaultDataService, defaultUIService)(model, msg);
    },
    subscriptions: () => Sub.none()
});

/**
 * 🏪 REWARDS MODULE INSTANCE
 * Exporta el Provider y los hooks del módulo.
 */
export const RewardsModule = createTEAModule(rewardsDefinition);

// Hooks públicos
export const useRewardsStore = RewardsModule.useStore;
export const useRewardsDispatch = RewardsModule.useDispatch;
export const RewardsProvider = RewardsModule.Provider;

// Selectors
export const selectRewardsModel = (state: { model: RewardsModel }) => state.model;
export const selectRewardsDispatch = (state: { dispatch: (msg: RewardsMsg) => void }) => state.dispatch;
