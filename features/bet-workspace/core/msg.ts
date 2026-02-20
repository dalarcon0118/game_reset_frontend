// Combined MsgType enum and Msg union type
import { GameType } from '@/types';
import { ManagementFeatMsg } from '../management/management.types';
import { KeyboardFeatMsg } from '../edit/keyboard.types';
import { BolitaMsg } from '../../bet-bolita/bolita.types';
import { RulesFeatMsg } from '../rules/rules.types';
import { ListFeatMsg } from '../list/list.types';
import { CreateFeatMsg } from '../create/create.types';
import { EditFeatMsg } from '../edit/edit.types';
import { RewardsRulesFeatMsg } from '../rewards/rewards.types';
import { UiFeatMsg } from '../ui/ui.types';
import { SuccessMsg } from '../success/success.types';
import { LoteriaFeatMsg } from '../../bet-loteria/loteria.types';
import { WebData } from '@/shared/core/remote.data';
import { DrawType } from '@/types';

// Export Model from bet-workspace/model
export { Model } from '../model';
export * from '../model';

export enum CoreMsgType {
    DRAW_INFO_REQUESTED = 'CORE.DRAW_INFO_REQUESTED',
    DRAW_INFO_RECEIVED = 'CORE.DRAW_INFO_RECEIVED',
    SCREEN_FOCUSED = 'CORE.SCREEN_FOCUSED',
    SET_NAVIGATION = 'CORE.SET_NAVIGATION',
    CLEAR_NAVIGATION = 'CORE.CLEAR_NAVIGATION',
    NAVIGATION_BEFORE_REMOVE = 'CORE.NAVIGATION_BEFORE_REMOVE',
    SET_IS_EDITING = 'CORE.SET_IS_EDITING',
    NAVIGATE_TO_CREATE = 'CORE.NAVIGATE_TO_CREATE',
}

export type CoreMsg =
    | { type: CoreMsgType.DRAW_INFO_REQUESTED; drawId: string }
    | { type: CoreMsgType.DRAW_INFO_RECEIVED; webData: WebData<DrawType> }
    | { type: CoreMsgType.SCREEN_FOCUSED; drawId: string; isEditing: boolean }
    | { type: CoreMsgType.SET_NAVIGATION; navigation: any }
    | { type: CoreMsgType.CLEAR_NAVIGATION }
    | { type: CoreMsgType.NAVIGATION_BEFORE_REMOVE; event: any; navigation: any }
    | { type: CoreMsgType.SET_IS_EDITING; isEditing: boolean }
    | { type: CoreMsgType.NAVIGATE_TO_CREATE };

export type SuccessFeatMsg = { type: 'SUCCESS'; payload: SuccessMsg };

/**
 * Global Msg type using Wrapped Messages pattern (Elm style).
 * Each sub-module message is wrapped in its own variant.
 */
export type Msg =
    | { type: 'CORE'; payload: CoreMsg }
    | ManagementFeatMsg
    | KeyboardFeatMsg
    | BolitaMsg
    | RulesFeatMsg
    | ListFeatMsg
    | CreateFeatMsg
    | EditFeatMsg
    | RewardsRulesFeatMsg
    | UiFeatMsg
    | SuccessFeatMsg
    | LoteriaFeatMsg;
