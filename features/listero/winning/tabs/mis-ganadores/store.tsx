import { createTEAModule, defineTeaModule } from '@core/engine/tea_module';
import { Cmd, ret, Return } from '@core/tea-utils';
import { MisGanadoresModel, MisGanadoresMsg, MisGanadoresMsg as MisGanadoresMsgImport } from './types';
import { initialMisGanadoresModel } from './model';
import { update, subscriptions } from './update';

export const misGanadoresDefinition = defineTeaModule<MisGanadoresModel, MisGanadoresMsg>({
  name: 'MisGanadores',
  initial: (): Return<MisGanadoresModel, MisGanadoresMsg> => {
    return ret(initialMisGanadoresModel, Cmd.ofMsg({ type: 'INIT' } as MisGanadoresMsgImport));
  },
  update,
  subscriptions
});

export const MisGanadoresModule = createTEAModule(misGanadoresDefinition);

export const useMisGanadoresStore = MisGanadoresModule.useStore;
export const useMisGanadoresDispatch = MisGanadoresModule.useDispatch;
export const MisGanadoresProvider = MisGanadoresModule.Provider;