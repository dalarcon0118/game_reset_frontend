import React, { useEffect } from 'react';
import { ActivityIndicator, View, TouchableOpacity } from 'react-native';
import { match } from 'ts-pattern';
import { RemoteData } from '@core/tea-utils';
import { Label, Flex } from '@/shared/components';
import { PluginContext } from '@core/plugins/plugin.types';
import DrawItem from './views/draw_item';
import { useDrawsListPluginStore, selectModel, selectDispatch, selectInit } from './store';
import { REFRESH_CLICKED, RULES_CLICKED, REWARDS_CLICKED, BETS_LIST_CLICKED, CREATE_BET_CLICKED, INIT_CONTEXT } from './msg';
import { styles } from './styles';
import { logger } from '@/shared/utils/logger';

import { DrawsListPluginConfig } from './model';

const log = logger.withTag('DRAWS_LIST_PLUGIN_VIEW');

interface DrawsListComponentProps {
  context: PluginContext;
  config: DrawsListPluginConfig;
}

export const DrawsListComponent: React.FC<DrawsListComponentProps> = ({ context, config }) => {
  const model = useDrawsListPluginStore(selectModel);
  const dispatch = useDrawsListPluginStore(selectDispatch);
  const init = useDrawsListPluginStore(selectInit);

  // log.debug('Rendering', { 
  //   hasContext: !!model.context, 
  //   drawsType: model.draws.type, 
  //   filteredCount: model.filteredDraws.length,
  //   drawsState: model.draws
  // });
  
  log.debug('DRAWS_STATE', { type: model.draws.type, count: model.filteredDraws.length });

  useEffect(() => {
    const shouldInit = !model.context ||
      model.context?.hostStore !== context.hostStore ||
      model.config !== config;

    if (shouldInit) {
      log.debug('Initializing context');
      init({ context, config });
      dispatch(INIT_CONTEXT({ context, config }));
    }
  }, [context, config, init, dispatch]); // Removed model.context and model.config from dependencies

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
            // SSOT: Draw viene de DrawRepository, los totales vienen de BetRepository
            // Pass both separately to avoid mixing sources
            return (
              <DrawItem
                key={draw.id}
                draw={draw}
                totalsByDrawId={model.totalsByDrawId}
                onRulePress={(id) => dispatch(RULES_CLICKED(id))}
                onRewardsPress={(id, title) => dispatch(REWARDS_CLICKED({ id, title }))}
                onBetsListPress={(id, title) => dispatch(BETS_LIST_CLICKED({ id, title }))}
                onCreateBetPress={(id, title) => dispatch(CREATE_BET_CLICKED({ id, title }))}
                showBalance={context.state.showBalance}
              />
            );
          })
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
