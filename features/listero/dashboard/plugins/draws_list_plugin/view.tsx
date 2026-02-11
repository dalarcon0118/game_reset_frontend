import React from 'react';
import { ActivityIndicator, View, TouchableOpacity } from 'react-native';
import { match } from 'ts-pattern';
import { RemoteData } from '@/shared/core/remote.data';
import { Label, Flex } from '@/shared/components';
import { PluginContext } from '@/shared/core/plugins/plugin.types';
import DrawItem from './views/draw_item';
import { useDrawsListPluginStore } from './store';
import { REFRESH_CLICKED, RULES_CLICKED, REWARDS_CLICKED, BETS_LIST_CLICKED, CREATE_BET_CLICKED } from './msg';
import { styles } from './styles';

import { DrawsListPluginConfig } from './model';

interface DrawsListComponentProps {
  context: PluginContext;
  config: DrawsListPluginConfig;
}

export const DrawsListComponent: React.FC<DrawsListComponentProps> = ({ context, config }) => {
  const { model, dispatch, init } = useDrawsListPluginStore();

  console.log('[DrawsListPlugin] Rendering. Context present:', !!model.context, 'Draws state:', model.draws.type, 'Filtered draws:', model.filteredDraws.length);

  const shouldInit = () =>
    !model.context ||
    model.context?.hostStore !== context.hostStore ||
    model.config !== config;

  if (shouldInit()) {
    console.log('[DrawsListPlugin] Initializing context');
    init({ context, config });
  }

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

  const renderSuccess = () => {
    const filteredDraws = model.filteredDraws || [];
    return (
      <View>
        {filteredDraws.length > 0 ? (
          filteredDraws.map((draw) => (
            <DrawItem
              key={draw.id}
              draw={draw}
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
  };

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
