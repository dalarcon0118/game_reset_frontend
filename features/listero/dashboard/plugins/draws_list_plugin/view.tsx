import React from 'react';
import { ActivityIndicator, View, TouchableOpacity } from 'react-native';
import { match } from 'ts-pattern';
import { WebData, RemoteData } from '@/shared/core/remote.data';
import { Label, Flex } from '@/shared/components';
import { PluginContext } from '@/shared/core/plugins/plugin.types';
import DrawItem from './views/draw_item';
import { useDrawsListPluginStore } from './store';
import { INIT_CONTEXT, SYNC_STATE, REFRESH_CLICKED, RULES_CLICKED, REWARDS_CLICKED, BETS_LIST_CLICKED, CREATE_BET_CLICKED } from './msg';
import { DRAW_FILTER } from './core/types';
import { styles } from './styles';

import { DrawsListPluginConfig } from './model';

interface DrawsListComponentProps {
  context: PluginContext;
  config: DrawsListPluginConfig;
}

export const DrawsListComponent: React.FC<DrawsListComponentProps> = ({ context, config }) => {
  const { model, dispatch } = useDrawsListPluginStore();
  const draws = context.state[config.drawsStateKey] as WebData<any>;
  const filter = context.state.statusFilter || DRAW_FILTER.ALL;

  React.useEffect(() => {
    if (model.context !== context || model.config !== config) {
      dispatch(INIT_CONTEXT({ context, config }));
    }
  }, [context, config, dispatch, model.context, model.config]);

  React.useEffect(() => {
    if (model.draws !== draws || model.currentFilter !== filter) {
      dispatch(SYNC_STATE({ draws, filter }));
    }
  }, [dispatch, draws, filter, model.draws, model.currentFilter]);

  const handleRefresh = () => {
    dispatch(REFRESH_CLICKED());
  };

  const renderNotAsked = () => null;

  const renderLoading = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#00C48C" />
      <Label style={styles.loadingText}>Cargando sorteos...</Label>
    </View>
  );

  const renderError = ({ error }: any) => (
    <View style={styles.centerContainer}>
      <Label style={styles.errorText}>Error al cargar sorteos</Label>
      <Label type="detail">{error?.message || String(error)}</Label>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={handleRefresh}
      >
        <Label style={styles.retryText}>Reintentar</Label>
      </TouchableOpacity>
    </View>
  );

  const renderSuccess = () => (
    <View>
      {(model.filteredDraws || []).length > 0 ? (
        model.filteredDraws.map((draw: any, index: number) => (
          <DrawItem
            key={draw.id}
            draw={draw}
            index={index}
            onRulePress={(id) => dispatch(RULES_CLICKED(id))}
            onRewardsPress={(id, title) => dispatch(REWARDS_CLICKED({ id, title }))}
            onBetsListPress={(id, title) => dispatch(BETS_LIST_CLICKED({ id, title }))}
            onCreateBetPress={(id, title) => dispatch(CREATE_BET_CLICKED({ id, title }))}
            showBalance={context.state.showBalance}
          />
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <Label style={styles.emptyText}>No hay sorteos para este filtro</Label>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.content}>
      <Flex justify="between" align="center" style={styles.sectionHeader}>
        <Label style={styles.sectionTitle}>Sorteos</Label>
        <Label type="detail" style={styles.drawCount}>
          {match(model.draws)
            .with(RemoteData.Success, ({ data }: any) => `${data.length} disponibles`)
            .otherwise(() => 'Cargando...')}
        </Label>
      </Flex>

      {match(model.draws)
        .with(RemoteData.NotAsked, renderNotAsked)
        .with(RemoteData.Loading, renderLoading)
        .with(RemoteData.Failure, renderError)
        .with(RemoteData.Success, renderSuccess)
        .exhaustive()}
    </View>
  );
};
