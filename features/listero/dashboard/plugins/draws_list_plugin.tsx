import React from 'react';
import { DrawsListComponent } from './draws_list_plugin/view';
import { Plugin, SlotProps } from '@/shared/core/plugins/plugin.types';
import { defaultConfig } from './draws_list_plugin/model';

const DrawsListPluginComponent: React.FC<SlotProps> = ({ context }) => {
    return <DrawsListComponent context={context} config={defaultConfig} />;
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
