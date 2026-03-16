import React from 'react';
import { DrawsListComponent } from './draws_list_plugin/view';
import { Plugin, SlotProps } from '@core/plugins/plugin.types';
import { defaultConfig } from './draws_list_plugin/model';
import { DrawsListModule } from './draws_list_plugin/store';

const DrawsListPluginComponent: React.FC<SlotProps> = ({ context }) => {
    return (
        <DrawsListModule.Provider initialParams={{ context, config: defaultConfig }}>
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
