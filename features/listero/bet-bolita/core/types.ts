import { createMsg } from '@/shared/core/msg';
import { BolitaModel, initialModel } from './model';

// Domain Message Payloads
import { ParletMsg, Model as ParletModel } from '../parlet/parlet.types';
import { FijosMsg } from '../standard/fijos.types';
import { CentenaMsg, Model as CentenaModel } from '../centena/centena.types';
import { ListMsg } from './list.types';
import { EditMsg } from './edit.types';

/**
 * Bolita Message Constructors
 * Using the createMsg pattern for type-safe message creation and matching.
 * These are the entry points for messages into the Bolita feature.
 */
export const PARLET = createMsg<'PARLET', ParletMsg>('PARLET');
export const FIJOS = createMsg<'FIJOS', FijosMsg>('FIJOS');
export const CENTENA = createMsg<'CENTENA', CentenaMsg>('CENTENA');
export const LIST = createMsg<'LIST', ListMsg>('LIST');
export const EDIT = createMsg<'EDIT', EditMsg>('EDIT');
export const SAVE_ALL_BETS = createMsg<'SAVE_ALL_BETS', { drawId: string }>('SAVE_ALL_BETS');
export const BOLITA_BETS_UPDATED = createMsg<'BOLITA_BETS_UPDATED', void>('BOLITA_BETS_UPDATED');

/**
 * Feature Message Types
 * Extracted from the constructors for type safety.
 */
export type ParletFeatureMsg = typeof PARLET._type;
export type FijosFeatMsg = typeof FIJOS._type;
export type CentenaFeatMsg = typeof CENTENA._type;
export type ListFeatMsg = typeof LIST._type;
export type EditFeatMsg = typeof EDIT._type;
export type SaveBetsMsg = typeof SAVE_ALL_BETS._type;
export type BolitaOutMsg = typeof BOLITA_BETS_UPDATED._type;

/**
 * Bolita Msg
 * Aggregates all messages related to the Bolita game.
 * Defined as a Discriminated Union for type safety.
 */
export type BolitaMsg =
    | ParletFeatureMsg
    | FijosFeatMsg
    | CentenaFeatMsg
    | ListFeatMsg
    | EditFeatMsg
    | SaveBetsMsg
    | BolitaOutMsg;

/**
 * Bolita State Constructor (Curried)
 * Facilitates functional composition using the Return monad.
 * 
 * Usage: singleton(makeBolitaState).andMapCmd(...)
 */
export const makeBolitaState = (parlet: ParletModel) => (fijos: any) => (centena: CentenaModel): BolitaModel => ({
    ...initialModel,
    ...fijos,
    ...centena,
    parletSession: parlet
});
