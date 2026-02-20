import { createMsg } from '@/shared/core/msg';
import { Model as GlobalModel } from '../bet-workspace/model';

// Domain Message Payloads
import { ParletMsg, Model as ParletModel } from './parlet/parlet.types';
import { FijosMsg } from './standard/fijos.types';
import { CentenaMsg, Model as CentenaModel } from './centena/centena.types';

/**
 * Bolita Message Constructors
 * Using the createMsg pattern for type-safe message creation and matching.
 */
export const PARLET = createMsg<'PARLET', ParletMsg>('PARLET');
export const FIJOS = createMsg<'FIJOS', FijosMsg>('FIJOS');
export const CENTENA = createMsg<'CENTENA', CentenaMsg>('CENTENA');
export const SAVE_ALL_BETS = createMsg<'SAVE_ALL_BETS', { drawId: string }>('SAVE_ALL_BETS');
export const BOLITA_BETS_UPDATED = createMsg<'BOLITA_BETS_UPDATED', void>('BOLITA_BETS_UPDATED');

/**
 * Feature Message Types
 * Extracted from the constructors for type safety.
 */
export type ParletFeatureMsg = typeof PARLET._type;
export type FijosFeatMsg = typeof FIJOS._type;
export type CentenaFeatMsg = typeof CENTENA._type;
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
    | SaveBetsMsg
    | BolitaOutMsg;

/**
 * Bolita Composite State Interface
 * Defines the contract for the aggregated state of the Bolita feature.
 * This ensures type safety when merging sub-feature states.
 */
export interface BolitaCompositeState {
    parletSession: ParletModel;
    // Centena and Standard state are currently merged into global
    // but we define them here for the constructor
    [key: string]: any;
}

/**
 * Bolita State Constructor (Curried)
 * Facilitates functional composition using the Return monad.
 * 
 * Usage: singleton(makeBolitaState).andMapCmd(...)
 */
export const makeBolitaState = (parlet: ParletModel) => (fijos: any) => (centena: CentenaModel): Partial<GlobalModel> => ({
    ...fijos,
    ...centena,
    parletSession: parlet
});

/**
 * Bolita Model
 * Currently maps to the Global Model as sub-features operate on the global scope.
 */
export type BolitaModel = GlobalModel;
