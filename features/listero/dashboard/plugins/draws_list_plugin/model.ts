import { PluginContext } from '@/shared/core/plugins/plugin.types';
import { WebData, RemoteData } from '@/shared/core/remote.data';
import { DRAW_FILTER } from './core/types';

export interface DrawsListPluginConfig {
  drawsStateKey: string;
  filteredDrawsStateKey: string;
  events: {
    refresh: string;
    rules: string;
    rewards: string;
    betsList: string;
    createBet: string;
  };
}

export const defaultConfig: DrawsListPluginConfig = {
  drawsStateKey: 'draws',
  filteredDrawsStateKey: 'filteredDraws',
  events: {
    refresh: 'dashboard:refresh_clicked',
    rules: 'dashboard:rules_clicked',
    rewards: 'dashboard:rewards_clicked',
    betsList: 'dashboard:bets_list_clicked',
    createBet: 'dashboard:create_bet_clicked'
  }
};

export interface Model {
  context: PluginContext | null;
  config: DrawsListPluginConfig;
  draws: WebData<any>;
  filteredDraws: any[];
  currentFilter: string;
}

export const initialModel: Model = {
  context: null,
  config: defaultConfig,
  draws: RemoteData.notAsked(),
  filteredDraws: [],
  currentFilter: DRAW_FILTER.ALL
};
