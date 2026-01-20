// Combined MsgType enum and Msg union type
import { GameType } from '@/types';
import { ManagementFeatMsg } from '../features/management/management.types';
import { KeyboardFeatMsg } from '../features/keyboard/keyboard.types';
import { ParletFeatMsg } from '../features/parlet/parlet.types';
import { CentenaFeatMsg } from '../features/centena/centena.types';
import { RulesFeatMsg } from '../features/rules/rules.types';
import { ListFeatMsg } from '../features/bet-list/list.types';
import { CreateFeatMsg } from '../features/create-bet/create.types';
import { EditFeatMsg } from '../features/edit-bet/edit.types';
import { RewardsRulesFeatMsg } from '../features/rewards-rules/rewards.types';
import { UiFeatMsg } from '../features/bet-ui/ui.types';
import { FijosFeatMsg } from '../features/fijos-corridos/fijos.types';
import { LoteriaFeatMsg } from '@/features/listero/games/loteria/loteria.types';
import { WebData } from '@/shared/core/remote.data';

export * from './core.types';

export enum CoreMsgType {
    DRAW_INFO_REQUESTED = 'CORE.DRAW_INFO_REQUESTED',
    DRAW_INFO_RECEIVED = 'CORE.DRAW_INFO_RECEIVED',
}

export type CoreMsg =
    | { type: CoreMsgType.DRAW_INFO_REQUESTED; drawId: string }
    | { type: CoreMsgType.DRAW_INFO_RECEIVED; webData: WebData<string> };

/**
 * Global Msg type using Wrapped Messages pattern (Elm style).
 * Each sub-module message is wrapped in its own variant.
 */
export type Msg =
    | { type: 'CORE'; payload: CoreMsg }
    | ManagementFeatMsg
    | KeyboardFeatMsg
    | ParletFeatMsg
    | CentenaFeatMsg
    | RulesFeatMsg
    | ListFeatMsg
    | CreateFeatMsg
    | EditFeatMsg
    | RewardsRulesFeatMsg
    | UiFeatMsg
    | FijosFeatMsg
    | LoteriaFeatMsg;
