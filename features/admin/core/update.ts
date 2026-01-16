// Main update function for admin dashboard
import { Model } from './model';
import { Msg } from './msg';
import { initialModel } from './initial.types';

export const init = (): Model => {
    return initialModel;
};

export function update(model: Model, msg: Msg): Model {
    switch (msg.type) {
        // Navigation
        case 'NAVIGATE_TO_SECTION':
            return { ...model, activeSection: msg.payload };

        // Feature messages (placeholder - will be implemented when features are created)
        case 'ROLES_MSG':
        case 'STRUCTURES_MSG':
        case 'USERS_MSG':
        case 'DRAW_CONFIG_MSG':
        case 'RULES_MSG':
        case 'DRAWS_MSG':
        case 'SEED_GENERATOR_MSG':
            // TODO: Implement feature-specific updates
            return model;

        // Global UI
        case 'SET_LOADING':
            return { ...model, loading: msg.payload };

        case 'SET_ERROR':
            return { ...model, error: msg.payload };

        case 'ADD_NOTIFICATION':
            return {
                ...model,
                notifications: [...model.notifications, msg.payload]
            };

        case 'REMOVE_NOTIFICATION':
            return {
                ...model,
                notifications: model.notifications.filter(n => n.id !== msg.payload)
            };

        default:
            return model;
    }
}
