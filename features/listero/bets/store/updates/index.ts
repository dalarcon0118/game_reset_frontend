import { match } from 'ts-pattern';
import { Model } from '../types/core.types';
import { Msg, MsgType } from '../types/index';
import { Cmd } from '@/shared/core/cmd';
import { updateBetTypes } from './betTypes.update';
import { updateBetManagement } from './betManagement.update';
import { updateUiKeyboard } from './uiKeyboard.update';
import { updateList } from './list.update';
import { updateCreate } from './create.update';
import { updateEdit } from './edit.update';
import { updateParlet } from './parlet.update';
import { updateRewardsRules } from './rewardsRules.update';
import { updateUi } from './ui.update';
import { UiKeyboardMsgType } from '../types/uiKeyboard.types';
import { BetManagementMsgType } from '../types/betManagement.types';
import { ListMsgType } from '../types/list.types';
import { CreateMsgType } from '../types/create.types';
import { EditMsgType } from '../types/edit.types';
import { ParletMsgType } from '../types/parlet.types';
import { RewardsRulesMsgType } from '../types/rewardsRules.types';
import { UiMsgType } from '../types/ui.types';

// Type guards
const isListMsg = (msg: Msg): msg is any => {
    return Object.values(ListMsgType).includes(msg.type as any);
};

const isCreateMsg = (msg: Msg): msg is any => {
    return Object.values(CreateMsgType).includes(msg.type as any);
};

const isEditMsg = (msg: Msg): msg is any => {
    return Object.values(EditMsgType).includes(msg.type as any);
};

const isParletMsg = (msg: Msg): msg is any => {
    return Object.values(ParletMsgType).includes(msg.type as any);
};

const isRewardsRulesMsg = (msg: Msg): msg is any => {
    return Object.values(RewardsRulesMsgType).includes(msg.type as any);
};

const isUiMsg = (msg: Msg): msg is any => {
    return Object.values(UiMsgType).includes(msg.type as any);
};

export const update = (model: Model, msg: Msg): [Model, Cmd] => {
    // Try each update function in order of responsibility
    let result: [Model, Cmd] = [model, Cmd.none];

    // Bet Types
    result = updateBetTypes(model, msg as any);
    if (result[0] !== model) return result;

    // Bet Management
    result = updateBetManagement(model, msg as any);
    if (result[0] !== model) return result;

    // UI Keyboard
    result = updateUiKeyboard(model, msg as any);
    if (result[0] !== model) return result;

    // List
    result = updateList(model, msg as any);
    if (result[0] !== model) return result;

    // Create
    result = updateCreate(model, msg as any);
    if (result[0] !== model) return result;

    // Edit
    result = updateEdit(model, msg as any);
    if (result[0] !== model) return result;

    // Parlet
    result = updateParlet(model, msg as any);
    if (result[0] !== model) return result;

    // Rewards & Rules
    result = updateRewardsRules(model, msg as any);
    if (result[0] !== model) return result;

    // UI
    result = updateUi(model, msg as any);
    if (result[0] !== model) return result;

    return [model, Cmd.none];
};
