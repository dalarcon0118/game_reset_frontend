import React from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { match } from 'ts-pattern';
import { RemoteData } from '@core/tea-utils';
import { Label } from '@/shared/components';
import { PluginContext } from '@core/plugins/plugin.types';
import DrawItem from './views/draw_item';
import { DrawsListModule } from './store';
import { REFRESH_CLICKED, RULES_CLICKED, REWARDS_CLICKED, BETS_LIST_CLICKED, CREATE_BET_CLICKED, REQUEST_LOCAL_DRAWS } from './msg';
import { styles } from './styles';
import { logger } from '@/shared/utils/logger';
import { DrawsListPluginConfig } from './model';
import { DrawsListSkeleton } from '@/shared/components/moti_skeleton';
const { useEffect } = React;

const log = logger.withTag('DRAWS_LIST_PLUGIN_VIEW');

interface DrawsListComponentProps {
  context: PluginContext;
  config: DrawsListPluginConfig;
}

export const DrawsListComponent: React.FC<DrawsListComponentProps> = ({ context }) => {
  // 🛡️ MEJORA: Un solo hook para el store completo (como WinnersScreen)
  const { model, dispatch } = DrawsListModule.useStore();

  const hasRequestedLocalDraws = React.useRef(false);
  const contextRef = React.useRef(context);

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  useEffect(() => {
    const currentDraws = model.draws;
    const drawsType = currentDraws.type;
    const hasData = drawsType === 'Success' && (currentDraws as any).data?.length > 0;
    const hasStructureId = !!(contextRef.current?.state as any)?.userStructureId;

    log.debug('DrawsListComponent effect check', {
      drawsType,
      hasData,
      hasStructureId,
      alreadyRequested: hasRequestedLocalDraws.current
    });

    const needsLocalLoad =
      !hasData &&
      hasStructureId &&
      !hasRequestedLocalDraws.current;

    if (needsLocalLoad) {
      hasRequestedLocalDraws.current = true;
      log.info('Triggering defensive local load', { drawsType, hasStructureId });
      dispatch(REQUEST_LOCAL_DRAWS());
    }
  }, []);

  const handleRefresh = () => {
    dispatch(REFRESH_CLICKED());
  };

  const renderNotAsked = () => (
    <DrawsListSkeleton loading={true} />
  );

  const renderLoading = () => (
    <DrawsListSkeleton loading={true} />
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
            log.debug('Rendering DrawItem', { draw });
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
            {(() => {
              log.debug('No draws available');
              return <Label style={styles.emptyText}>No hay sorteos disponibles</Label>;
            })()}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.content}>
      {(() => {
        const state = model?.draws?.type || 'NotAsked';
        log.info('Rendering DrawsList state:', { 
          state, 
          drawsDataLength: (model?.draws as any)?.data?.length || 0,
          filteredCount: model?.filteredDraws?.length || 0,
          hasHostStore: !!context?.hostStore,
          firstFilteredDraw: model?.filteredDraws?.[0] ? { id: model.filteredDraws[0].id, status: model.filteredDraws[0].status } : null
        });
        setTimeout(() => {
          //force refresh if no filtered draws available
          if (model?.filteredDraws?.length === 0) {
            handleRefresh();
          }
        }, 5000);
        
        return match(model?.draws || RemoteData.notAsked())
          .with({ type: 'NotAsked' }, renderNotAsked)
          .with({ type: 'Loading' }, renderLoading)
          .with({ type: 'Failure' }, renderError)
          .with({ type: 'Success' }, renderSuccess)
          .exhaustive();
      })()}
    </View>
  );
};
