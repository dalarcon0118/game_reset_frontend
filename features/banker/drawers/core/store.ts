import { createTEAModule, defineTeaModule } from '@core/engine/tea_module';
import { Model } from './model';
import { Msg } from './msg';
import { update, subscriptions, init } from './update';
import { Return } from '@core/tea-utils';

export const DrawersModule = createTEAModule(
    defineTeaModule<Model, Msg>({
        name: 'Drawers',
        initial: init as any,
        update: (model, msg) => {
            const result = update(model, msg);
            return result instanceof Return ? [result.model, result.cmd] : result;
        },
        subscriptions,
    })
);

// Hooks & Provider (Derived from DrawersModule)
export const DrawersStoreProvider = DrawersModule.Provider;
export const useDrawersStore = DrawersModule.useStore;
export const useDrawersDispatch = DrawersModule.useDispatch;

export const selectDrawersModel = (state: { model: Model }) => state.model;
export const selectDrawersDispatch = (state: { dispatch: (msg: Msg) => void }) => state.dispatch;