// Combined MsgType enum and Msg union type
import { BetManagementMsgType, BetManagementMsg } from './betManagement.types';
import { UiKeyboardMsgType, UiKeyboardMsg } from './uiKeyboard.types';
import { ParletMsgType, ParletMsg } from './parlet.types';
import { ListMsgType, ListMsg } from './list.types';
import { CreateMsgType, CreateMsg } from './create.types';
import { EditMsgType, EditMsg } from './edit.types';
import { RewardsRulesMsgType, RewardsRulesMsg } from './rewardsRules.types';
import { UiMsgType, UiMsg } from './ui.types';
import { GameType } from '../../../../types';

export * from './core.types';

// Individual message types
export * from './betManagement.types';
export * from './uiKeyboard.types';
export * from './parlet.types';
export * from './list.types';
export * from './create.types';
export * from './edit.types';
export * from './rewardsRules.types';
export * from './ui.types';

export const MsgType = {
    ...BetManagementMsgType,
    ...UiKeyboardMsgType,
    ...ParletMsgType,
    ...ListMsgType,
    ...CreateMsgType,
    ...EditMsgType,
    ...RewardsRulesMsgType,
    ...UiMsgType,

    // Add bet types specific messages
    FETCH_BET_TYPES_REQUESTED: 'FETCH_BET_TYPES_REQUESTED',
    FETCH_BET_TYPES_SUCCEEDED: 'FETCH_BET_TYPES_SUCCEEDED',
    FETCH_BET_TYPES_FAILED: 'FETCH_BET_TYPES_FAILED',
} as const;

export type Msg =
    | BetManagementMsg
    | UiKeyboardMsg
    | ParletMsg
    | ListMsg
    | CreateMsg
    | EditMsg
    | RewardsRulesMsg
    | UiMsg
    // Bet types messages
    | { type: typeof MsgType.FETCH_BET_TYPES_REQUESTED; drawId: string }
    | { type: typeof MsgType.FETCH_BET_TYPES_SUCCEEDED; betTypes: GameType[] }
    | { type: typeof MsgType.FETCH_BET_TYPES_FAILED; error: string };
