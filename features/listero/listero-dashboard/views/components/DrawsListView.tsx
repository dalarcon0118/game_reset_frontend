import React, { useCallback } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { match } from 'ts-pattern';
import { RemoteData } from '@core/tea-utils';
import { Label } from '@/shared/components';
import { useDashboardStore } from '../../store';
import { REFRESH_CLICKED } from '../../core/msg';
import { drawsListStyles as styles } from '../../core/styles';
import DrawItem from './draw_item';

export const DrawsListView: React.FC = () => {
  const model = useDashboardStore((s) => s.model);
  const dispatch = useDashboardStore((s) => s.dispatch);

  const handleRefresh = useCallback(() => dispatch(REFRESH_CLICKED()), [dispatch]);

  const handleBetsListPress = useCallback((id: string, title: string, draw: any) => {
    dispatch({ type: 'BETS_LIST_CLICKED', drawId: id, title, drawType: draw.draw_type_details?.code });
  }, [dispatch]);

  const handleCreateBetPress = useCallback((id: string, title: string, draw: any) => {
    dispatch({ type: 'CREATE_BET_CLICKED', drawId: id, title, drawType: draw.draw_type_details?.code });
  }, [dispatch]);

  const renderNotAsked = () => (
    <View style={styles.content}>
      <View style={styles.centerContainer}>
        <Label>Cargando sorteos...</Label>
      </View>
    </View>
  );

  const renderLoading = () => renderNotAsked();

  const renderError = ({ error }: { error: unknown }) => (
    <View style={styles.centerContainer}>
      <Label style={styles.errorText}>Error al cargar sorteos</Label>
      <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
        <Label style={styles.retryText}>Reintentar</Label>
      </TouchableOpacity>
    </View>
  );

  const renderSuccess = () => {
    const filteredDraws = (model.filteredDraws || []).filter((draw) => draw && draw.id != null);
    return (
      <View style={styles.content}>
        {filteredDraws.length > 0 ? (
          filteredDraws.map((draw) => (
            <DrawItem
              key={draw.id}
              draw={draw}
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