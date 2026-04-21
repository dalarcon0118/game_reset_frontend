import { createTEAModule, defineTeaModule } from '@core/engine/tea_module';
import { Cmd, ret, Return } from '@core/tea-utils';
import { TodosModel, TodosMsg, TodosMsg as TodosMsgImport } from './types';
import { initialTodosModel } from './model';
import { update, subscriptions } from './update';

export const todosDefinition = defineTeaModule<TodosModel, TodosMsg>({
  name: 'TodosWinners',
  initial: (): Return<TodosModel, TodosMsg> => {
    return ret(initialTodosModel, Cmd.ofMsg({ type: 'INIT' } as TodosMsgImport));
  },
  update,
  subscriptions
});

export const TodosModule = createTEAModule(todosDefinition);

export const useTodosStore = TodosModule.useStore;
export const useTodosDispatch = TodosModule.useDispatch;
export const TodosProvider = TodosModule.Provider;