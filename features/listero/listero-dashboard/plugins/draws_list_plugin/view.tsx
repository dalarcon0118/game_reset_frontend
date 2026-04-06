import React, { useEffect } from 'react';
import { ActivityIndicator, View, TouchableOpacity } from 'react-native';
import { match } from 'ts-pattern';
import { RemoteData } from '@core/tea-utils';
import { Label } from '@/shared/components';
import { PluginContext } from '@core/plugins/plugin.types';
import DrawItem from './views/draw_item';
import { DrawsListModule, selectModel, selectDispatch } from './store';
import { REFRESH_CLICKED, RULES_CLICKED, REWARDS_CLICKED, BETS_LIST_CLICKED, CREATE_BET_CLICKED } from './msg';
import { styles } from './styles';
import { logger } from '@/shared/utils/logger';

import { DrawsListPluginConfig } from './model';

const log = logger.withTag('DRAWS_LIST_PLUGIN_VIEW');

interface DrawsListComponentProps {
  context: PluginContext;
  config: DrawsListPluginConfig;
}

export const DrawsListComponent: React.FC<DrawsListComponentProps> = ({ context }) => {
  const model = DrawsListModule.useStore(selectModel);
  const dispatch = DrawsListModule.useStore(selectDispatch);

  useEffect(() => {
   console.log('-----Render DrawsListComponent mounted---');
  }, []);

  const handleRefresh = () => {
    dispatch(REFRESH_CLICKED());
  };

  const renderNotAsked = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#00C48C" />
      <Label style={styles.loadingText}>Iniciando sorteos...</Label>
    </View>
  );

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
          filteredDraws.map((draw) => {
            return (
              <DrawItem
                key={draw.id}
                draw={draw}
                totalsByDrawId={model.totalsByDrawId}
                onRulePress={(id) => dispatch(RULES_CLICKED(id))}
                onRewardsPress={(id, title, d) => dispatch(REWARDS_CLICKED({ id, title, draw: d }))}
                onBetsListPress={(id, title, d) => dispatch(BETS_LIST_CLICKED({ id, title, draw: d }))}
                onCreateBetPress={(id, title, d) => dispatch(CREATE_BET_CLICKED({ id, title, draw: d }))}
                showBalance={context.state.showBalance}
              />
            );
          })
        ) : (
          <View style={styles.centerContainer}>
            <Label style={styles.emptyText}>No hay sorteos disponibles</Label>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.content}>
      {match(model?.draws || RemoteData.notAsked())
        .with({ type: 'NotAsked' }, renderNotAsked)
        .with({ type: 'Loading' }, renderLoading)
        .with({ type: 'Failure' }, renderError)
        .with({ type: 'Success' }, renderSuccess)
        .exhaustive()}
    </View>
  );
};
