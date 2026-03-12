import { match } from 'ts-pattern';
import { Model } from '../model';
import { Return, singleton, ret, Cmd } from '@core/tea-utils';
import { updateCreate } from '../create/core/update';
import { updateEdit } from '../edit/core/update';
import { updateList } from '../list/core/update';
import { updateManagement } from '../management/core/update';
import { updateRules } from '../rules/core/update';
import { CreateMsg } from '../create/core/types';
import { EditMsg } from '../edit/core/types';
import { ListMsg } from '../list/core/types';
import { ManagementMsg } from '../management/core/types';
import { RulesMsg } from '../rules/core/types';

export type Msg =
    | { type: 'CREATE'; payload: CreateMsg }
    | { type: 'EDIT'; payload: EditMsg }
    | { type: 'LIST'; payload: ListMsg }
    | { type: 'MANAGEMENT'; payload: ManagementMsg }
    | { type: 'RULES'; payload: RulesMsg }
    | { type: 'SET_CURRENT_DRAW'; drawId: string | null }
    | { type: 'SET_EDITING'; isEditing: boolean };

const makeModel = (model: Model) => model;

export const update = (msg: Msg, model: Model): Return<Model, Msg> => {
    return match(msg)
        .with({ type: 'CREATE' }, ({ payload }) => {
            return singleton(makeModel)
                .andMapCmd(
                    (subMsg) => ({ type: 'CREATE', payload: subMsg }),
                    updateCreate(model, payload)
                );
        })
        .with({ type: 'EDIT' }, ({ payload }) => {
            return singleton(makeModel)
                .andMapCmd(
                    (subMsg) => ({ type: 'EDIT', payload: subMsg }),
                    updateEdit(model, payload)
                );
        })
        .with({ type: 'LIST' }, ({ payload }) => {
            return singleton(makeModel)
                .andMapCmd(
                    (subMsg) => ({ type: 'LIST', payload: subMsg }),
                    updateList(model, payload)
                );
        })
        .with({ type: 'MANAGEMENT' }, ({ payload }) => {
            return singleton(makeModel)
                .andMapCmd(
                    (subMsg) => ({ type: 'MANAGEMENT', payload: subMsg }),
                    updateManagement(model, payload)
                );
        })
        .with({ type: 'RULES' }, ({ payload }) => {
            return singleton(makeModel)
                .andMapCmd(
                    (subMsg) => ({ type: 'RULES', payload: subMsg }),
                    updateRules(model, payload)
                );
        })
        .with({ type: 'SET_CURRENT_DRAW' }, ({ drawId }) => {
            return singleton({ ...model, currentDrawId: drawId });
        })
        .with({ type: 'SET_EDITING' }, ({ isEditing }) => {
            return singleton({ ...model, isEditing });
        })
        .otherwise(() => singleton(model));
};
