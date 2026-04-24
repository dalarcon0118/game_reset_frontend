import React, { useCallback } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { match } from 'ts-pattern';
import { RemoteData } from '@core/tea-utils';
import { Label } from '@/shared/components';
import DrawItem from '../../plugins/draws_list_plugin/views/draw_item';
import { useDashboardStore, useListeroDashboardStoreApi } from '../../store';
import { REFRESH_CLICKED } from '../../core/msg';
import { styles } from '../../plugins/draws_list_plugin/styles';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('DRAWS_LIST_VIEW');

export const DrawsListView: React.FC = () => {
  const model = useDashboardStore((state) => state.model);
  const dispatch = useDashboardStore((state) => state.dispatch);

  const handleRefresh = useCallback(() => dispatch(REFRESH_CLICKED()), [dispatch]);

  const handleBetsListPress = useCallback((id: string, title: string, _draw: any) => {
    dispatch({ type: 'BETS_LIST_CLICKED', drawId: id, title });
  }, [dispatch]);

  const handleCreateBetPress = useCallback((id: string, title: string, _draw: any) => {
    dispatch({ type: 'CREATE_BET_CLICKED', drawId: id, title });
  }, [dispatch]);

  const renderNotAsked = () => <View style={styles.content}><View style={styles.centerContainer}><Label> Cargando sorteos... </Label></View></View>;

  const renderLoading = () => <View style={styles.content}><View style={styles.centerContainer}><Label> Cargando sorteos... </Label></View></View>;

  const renderError = ({ error }: any) => (
    <View style={styles.centerContainer}>
      <Label style={styles.errorText}>Error al cargar sorteos</Label>
      <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
        <Label style={styles.retryText}>Reintentar</Label>
      </TouchableOpacity>
    </View>
  );

  const renderSuccess = () => {
    const filteredDraws = (model.filteredDraws || []).filter(
      (draw) => draw && draw.id != null
    );
    return (
      <View style={styles.content}>
        {filteredDraws.length > 0 ? (
          filteredDraws.map((draw) => (
            <DrawItem
              key={draw.id}
              draw={draw}
              totalsByDrawId={model.totalsByDrawId}
              onBetsListPress={handleBetsListPress}
              onCreateBetPress={handleCreateBetPress}
              showBalance={model.showBalance}
            />
          ))
        ) : (
          <View style={styles.centerContainer}>
            <Label style={styles.emptyText}>No hay sorteos disponibles</Label>
          </View>
        )}
      </View>
    );
  };

  return match(model.draws || RemoteData.notAsked())
    .with({ type: 'NotAsked' }, renderNotAsked)
    .with({ type: 'Loading' }, renderLoading)
    .with({ type: 'Failure' }, renderError)
    .with({ type: 'Success' }, renderSuccess)
    .exhaustive();
};