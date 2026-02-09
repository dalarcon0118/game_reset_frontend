import { Model } from './model';
import { Msg } from './msg';
import { Return } from '@/shared/core/return';

import { updateCore } from './core.update';
import { updateManagement } from '../features/management/management.update';
import { updateKeyboard } from '../features/keyboard/keyboard.update';
import { updateParlet } from '../features/parlet/parlet.update';
import { updateFijos } from '../features/fijos-corridos/fijos.update';
import { updateCentena } from '../features/centena/centena.update';
import { updateLoteria } from '@/features/listero/games/loteria/loteria.update';
import { updateList } from '../features/bet-list/list.update';
import { updateCreate } from '../features/create-bet/create.update';
import { updateEdit } from '../features/edit-bet/edit.update';
import { updateRules } from '../features/rules/rules.update';
import { updateRewardsRules } from '../features/rewards-rules/rewards.update';
import { updateUi } from '../features/bet-ui/ui.update';
import { updateSuccess } from '../features/success/success.update';

export interface RegistryEntry {
    update: (model: Model, payload: any) => Return<Model, any>;
    wrapper: (payload: any) => Msg;
    requiresSummary: boolean;
    isCore?: boolean;
}

export const featureRegistry: Record<string, RegistryEntry> = {
    'CORE': {
        update: updateCore as any,
        wrapper: (payload) => ({ type: 'CORE', payload }),
        requiresSummary: false,
        isCore: true
    },
    'MANAGEMENT': {
        update: updateManagement as any,
        wrapper: (payload) => ({ type: 'MANAGEMENT', payload }),
        requiresSummary: true
    },
    'KEYBOARD': {
        update: updateKeyboard as any,
        wrapper: (payload) => ({ type: 'KEYBOARD', payload }),
        requiresSummary: false
    },
    'PARLET': {
        update: updateParlet as any,
        wrapper: (payload) => ({ type: 'PARLET', payload }),
        requiresSummary: true
    },
    'FIJOS': {
        update: updateFijos as any,
        wrapper: (payload) => ({ type: 'FIJOS', payload }),
        requiresSummary: true
    },
    'CENTENA': {
        update: updateCentena as any,
        wrapper: (payload) => ({ type: 'CENTENA', payload }),
        requiresSummary: true
    },
    'LOTERIA': {
        update: updateLoteria as any,
        wrapper: (payload) => ({ type: 'LOTERIA', payload }),
        requiresSummary: true
    },
    'LIST': {
        update: updateList as any,
        wrapper: (payload) => ({ type: 'LIST', payload }),
        requiresSummary: true
    },
    'CREATE': {
        update: updateCreate as any,
        wrapper: (payload) => ({ type: 'CREATE', payload }),
        requiresSummary: true
    },
    'EDIT': {
        update: updateEdit as any,
        wrapper: (payload) => ({ type: 'EDIT', payload }),
        requiresSummary: true
    },
    'RULES': {
        update: updateRules as any,
        wrapper: (payload) => ({ type: 'RULES', payload }),
        requiresSummary: false
    },
    'REWARDS_RULES': {
        update: updateRewardsRules as any,
        wrapper: (payload) => ({ type: 'REWARDS_RULES', payload }),
        requiresSummary: false
    },
    'UI': {
        update: updateUi as any,
        wrapper: (payload) => ({ type: 'UI', payload }),
        requiresSummary: false
    },
    'SUCCESS': {
        update: updateSuccess as any,
        wrapper: (payload) => ({ type: 'SUCCESS', payload }),
        requiresSummary: false
    }
};
