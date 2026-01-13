// Combined MsgType enum and Msg union type
import { GameType } from '@/types';
import { ManagementMsg } from '../features/management/management.types';
import { KeyboardMsg } from '../features/keyboard/keyboard.types';
import { ParletMsg } from '../features/parlet/parlet.types';
import { ListMsg } from '../features/bet-list/list.types';
import { CreateMsg } from '../features/create-bet/create.types';
import { EditMsg } from '../features/edit-bet/edit.types';
import { RewardsRulesMsg } from '../features/rewards-rules/rewards.types';
import { UiMsg } from '../features/bet-ui/ui.types';
import { FijosMsg } from '../features/fijos-corridos/fijos.types';

export * from './core.types';

/**
 * Global Msg type using Wrapped Messages pattern (Elm style).
 * Each sub-module message is wrapped in its own variant.
 */
export type Msg =
    | { type: 'MANAGEMENT'; payload: ManagementMsg }
    | { type: 'KEYBOARD'; payload: KeyboardMsg }
    | { type: 'PARLET'; payload: ParletMsg }
    | { type: 'LIST'; payload: ListMsg }
    | { type: 'CREATE'; payload: CreateMsg }
    | { type: 'EDIT'; payload: EditMsg }
    | { type: 'REWARDS_RULES'; payload: RewardsRulesMsg }
    | { type: 'UI'; payload: UiMsg }
    | { type: 'FIJOS'; payload: FijosMsg };
