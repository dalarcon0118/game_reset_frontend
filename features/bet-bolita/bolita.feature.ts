import { Feature, FeatureAdapter } from '@/shared/core/architecture/interfaces';
import { Model as GlobalModel } from '../bet-workspace/model';
import { match } from 'ts-pattern';
import { Return, singleton } from '@/shared/core/return';
import { Cmd } from '@/shared/core/cmd';
import { BolitaExternalFeaturesGateway, BolitaExternalFeaturesHandler } from './gateway';

// Sub-features Logic
import { updateParlet } from './parlet/parlet.update';
import { initialParletState } from './parlet/parlet.types';

import { updateFijos } from './standard/fijos.update';

import { updateCentena } from './centena/centena.update';
import { initialCentenaState } from './centena/centena.types';


// Types
import { BolitaMsg, PARLET, FIJOS, CENTENA, SAVE_ALL_BETS, makeBolitaState, BOLITA_BETS_UPDATED } from './bolita.types';
import { Sub } from '@/shared/core';
// Standard bet init is empty/partial in current implementation
const initialStandardState = {};

/**
 * Bolita Feature Adapter
 * Intercepts messages belonging to sub-features (PARLET, FIJOS, CENTENA)
 * and routes them to the Bolita Feature.
 */
const BolitaAdapter: FeatureAdapter<BolitaMsg, any> = {
    lift: (msg: BolitaMsg) => msg, // No wrapping needed as we operate on global message types
    lower: (msg: any): BolitaMsg | null => {
        if (!msg || typeof msg !== 'object') return null;

        // Strict check for known message types
        if (msg.type === PARLET.toString() || msg.type === FIJOS.toString() || msg.type === CENTENA.toString() || msg.type === SAVE_ALL_BETS.toString() || msg.type === BOLITA_BETS_UPDATED.toString()) {
            return msg as BolitaMsg;
        }
        return null;
    }
};

/**
 * Bolita Feature (Orchestrator)
 * 
 * Este módulo orquesta todas las reglas de negocio y estados relacionados con "La Bolita".
 * Actúa como un "Composite Feature" que delega la lógica a sus sub-módulos.
 */
export const BolitaFeature: Feature<GlobalModel, BolitaMsg> = {
    id: 'BOLITA',

    adapter: BolitaAdapter,

    init: () => {
        // Functional Composition of State and Commands
        // Uses the Applicative Functor pattern (Return Monad) to build the composite state
        // and automatically aggregate initialization commands from all sub-features.

        const ret = singleton(makeBolitaState)
            .andMapCmd(
                PARLET,
                Return.singleton(initialParletState)
            )
            .andMapCmd(
                FIJOS,
                Return.singleton(initialStandardState)
            )
            .andMapCmd(
                CENTENA,
                Return.singleton(initialCentenaState)
            );

        // The result is Return<Partial<GlobalModel>, BolitaMsg>
        // We cast the model to GlobalModel because the store expects the full app state structure.
        return [ret.model as GlobalModel, ret.cmd];
    },

    update: (msg, state) => {
        // Each update function returns { model, cmd } (Return type)
        // We need to destructure and return [model, cmd] tuple
        const result = match(msg)
            .with(PARLET.type(), (m) => {
                const ret = updateParlet(state, m.payload);
                const notify = BolitaExternalFeaturesGateway.emit(BOLITA_BETS_UPDATED());
                return [ret.model, notify ? Cmd.batch([ret.cmd, notify]) : ret.cmd];
            })
            .with(FIJOS.type(), (m) => {
                const ret = updateFijos(state, m.payload);
                const notify = BolitaExternalFeaturesGateway.emit(BOLITA_BETS_UPDATED());
                return [ret.model, notify ? Cmd.batch([ret.cmd, notify]) : ret.cmd];
            })
            .with(CENTENA.type(), (m) => {
                const ret = updateCentena(state, m.payload);
                const notify = BolitaExternalFeaturesGateway.emit(BOLITA_BETS_UPDATED());
                return [ret.model, notify ? Cmd.batch([ret.cmd, notify]) : ret.cmd];
            })
            .with(SAVE_ALL_BETS.type(), () => {
                // No-op in Bolita feature, intercepted by Gateway or handled as side-effect
                return [state, Cmd.none];
            })
            .with(BOLITA_BETS_UPDATED.type(), () => {
                // Internal loopback if any, usually ignored here as it's outbound
                return [state, Cmd.none];
            })
            // External Features Delegation (Composite Pattern via Gateway)
            .otherwise((m) => {
                const result = BolitaExternalFeaturesGateway.receive(m, state);
                if (result) {
                    return result;
                }
                // If not handled by gateway, it's an unhandled message
                return [state, Cmd.none];
            });

        return result as [GlobalModel, any];
    },

    subscriptions: (state) => {
        return BolitaExternalFeaturesGateway.subscriptions(state);
    },
    configure: (config: { externalGateway: BolitaExternalFeaturesHandler }) => {
        if (config.externalGateway) {
            BolitaExternalFeaturesGateway.register(config.externalGateway);
        }
    }
};
