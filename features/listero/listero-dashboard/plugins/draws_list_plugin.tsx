import React from 'react';
import { DrawsListComponent } from './draws_list_plugin/view';
import { Plugin, SlotProps } from '@core/plugins/plugin.types';
import { defaultConfig } from './draws_list_plugin/model';
import { DrawsListModule } from './draws_list_plugin/store';

const DrawsListPluginComponent: React.FC<SlotProps> = ({ context }) => {
    // 🛡️ ESTABILIZACIÓN DEL CONTEXTO:
    // Evitamos que el Store TEA se recree en cada render del Dashboard (TICK).
    const stableInitialParams = React.useMemo(() => {
        if (!context) return undefined;
        return {
            context: {
                api: context.api,
                storage: context.storage,
                events: context.events,
                hostStore: context.hostStore,
                state: { ...context.state }
            },
            config: defaultConfig
        };
    }, []); // Dependencias vacías = Referencia estable durante toda la vida del plugin.

    return (
        <DrawsListModule.Provider initialParams={stableInitialParams}>
            <DrawsListComponent context={context} config={defaultConfig} />
        </DrawsListModule.Provider>
    );
};

export const DrawsListPlugin: Plugin = {
    id: 'listero.dashboard.draws_list',
    name: 'Dashboard Draws List',
    slots: {
        'dashboard.draws_list': {
            component: DrawsListPluginComponent,
            layout: {
                order: 1,
                fullWidth: true
            }
        }
    },
    exports: {
        events: Object.values(defaultConfig.events)
    }
};
