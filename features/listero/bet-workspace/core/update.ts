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
import { UiMsg, UiMsgType } from '../ui/ui.types';
import { User } from '@/shared/repositories/auth/types/types';

export type Msg =
    | { type: 'CREATE'; payload: CreateMsg }
    | { type: 'EDIT'; payload: EditMsg }
    | { type: 'LIST'; payload: ListMsg }
    | { type: 'MANAGEMENT'; payload: ManagementMsg }
    | { type: 'RULES'; payload: RulesMsg }
    | { type: 'UI'; payload: UiMsg }
    | { type: 'SET_CURRENT_DRAW'; drawId: string | null }
    | { type: 'SET_EDITING'; isEditing: boolean }
    | { type: 'HOST_SYNCED'; user: User | null };

const makeModel = (model: Model) => model;

export const update = (msg: Msg, model: Model): Return<Model, Msg> => {
    return match(msg as Msg)
        .with({ type: 'HOST_SYNCED' }, (m) => {
            const user = (m as any).user;
            const isAuthenticated = user !== null && user !== undefined;

            return singleton({
                ...model,
                host: {
                    user,
                    isAuthenticated
                }
            });
        })
        .with({ type: 'CREATE' }, (m) => {
            const payload = (m as any).payload;
            return singleton(makeModel)
                .andMapCmd(
                    (subMsg) => ({ type: 'CREATE', payload: subMsg }),
                    updateCreate(model, payload)
                );
        })
        .with({ type: 'EDIT' }, (m) => {
            const payload = (m as any).payload;
            return singleton(makeModel)
                .andMapCmd(
                    (subMsg) => ({ type: 'EDIT', payload: subMsg }),
                    updateEdit(model, payload)
                );
        })
        .with({ type: 'LIST' }, (m) => {
            const payload = (m as any).payload;
            return singleton(makeModel)
                .andMapCmd(
                    (subMsg) => ({ type: 'LIST', payload: subMsg }),
                    updateList(model, payload)
                );
        })
        .with({ type: 'MANAGEMENT' }, (m) => {
            const payload = (m as any).payload;
            return singleton(makeModel)
                .andMapCmd(
                    (subMsg) => ({ type: 'MANAGEMENT', payload: subMsg }),
                    updateManagement(model, payload)
                );
        })
        .with({ type: 'RULES' }, (m) => {
            const payload = (m as any).payload;
            return singleton(makeModel)
                .andMapCmd(
                    (subMsg) => ({ type: 'RULES', payload: subMsg }),
                    updateRules(model, payload)
                );
        })
        .with({ type: 'UI' }, (m) => {
            const payload = (m as any).payload as UiMsg;
            const nextModel = match(payload as any)
                .with({ type: UiMsgType.SET_ACTIVE_ANNOTATION_TYPE }, (p) => ({
                    ...model,
                    centenaSession: { ...model.centenaSession, activeAnnotationType: (p as any).annotationType }
                }))
                .with({ type: UiMsgType.SET_ACTIVE_GAME_TYPE }, (p) => ({
                    ...model,
                    centenaSession: { ...model.centenaSession, activeGameType: (p as any).gameType }
                }))
                .with({ type: UiMsgType.CLEAR_ERROR }, () => ({
                    ...model,
                    error: null
                }))
                .with({ type: UiMsgType.CLOSE_ALL_DRAWERS }, () => ({
                    ...model,
                    showRulesDrawer: false // Placeholder if needed
                }))
                .otherwise(() => model);

            return singleton(nextModel);
        })
        .with({ type: 'SET_CURRENT_DRAW' }, (m) => {
            const drawId = (m as any).drawId;
            return singleton({ ...model, currentDrawId: drawId });
        })
        .with({ type: 'SET_EDITING' }, (m) => {
            const isEditing = (m as any).isEditing;
            return singleton({ ...model, isEditing });
        })
        .otherwise(() => singleton(model));
};
