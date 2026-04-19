import React, { useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trophy, Info, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { RemoteData } from '@core/tea-utils';
import { WinnerCard } from './components/WinnerCard';
import { ExtendedDrawType } from '@/shared/services/draw/types';
import { WinningBet } from '@/shared/repositories/bet/winnings.types';
import { useWinningStore } from '../core/store';
import { logger } from '@/shared/utils/logger';

const log = logger.withTag('WinnersScreen');

/**
 * 🎭 WinnerCardSkeleton
 * Componente de skeleton loading para mejorar UX
 */
const WinnerCardSkeleton: React.FC<{ theme: any }> = ({ theme }) => (
  <View style={[skeletonStyles.card, { backgroundColor: theme.card }]}>
    {/* Header skeleton */}
    <View style={skeletonStyles.headerRow}>
      <View style={[skeletonStyles.textSkeleton, skeletonStyles.titleSkeleton, { backgroundColor: theme.border }]} />
      <View style={[skeletonStyles.textSkeleton, skeletonStyles.subtitleSkeleton, { backgroundColor: theme.border }]} />
    </View>
    
    {/* Numbers skeleton */}
    <View style={skeletonStyles.numbersContainer}>
      <View style={[skeletonStyles.textSkeleton, skeletonStyles.labelSkeleton, { backgroundColor: theme.border }]} />
      <View style={[skeletonStyles.numberSkeleton, { backgroundColor: theme.border }]} />
    </View>
    
    {/* Meta skeleton */}
    <View style={[skeletonStyles.metaSkeleton, { borderTopColor: theme.border }]}>
      <View style={[skeletonStyles.textSkeleton, skeletonStyles.smallSkeleton, { backgroundColor: theme.border }]} />
    </View>
  </View>
);

const skeletonStyles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  textSkeleton: {
    borderRadius: 4,
  },
  titleSkeleton: {
    width: '50%',
    height: 20,
  },
  subtitleSkeleton: {
    width: '25%',
    height: 16,
  },
  numbersContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  labelSkeleton: {
    width: '30%',
    height: 14,
    marginBottom: 8,
  },
  numberSkeleton: {
    width: '60%',
    height: 32,
    borderRadius: 8,
  },
  metaSkeleton: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  smallSkeleton: {
    width: '40%',
    height: 12,
  },
});

export const WinnersScreen: React.FC = () => {
  const colorScheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const theme = Colors[colorScheme];
  
  const renderCount = useRef(0);
  renderCount.current++;

  log.debug(`[WinnersScreen] Render #${renderCount.current} START`);

  const { model } = useWinningStore();
  
  log.debug(`[WinnersScreen] After useWinningStore`, {
    render: renderCount.current,
    drawsType: model?.draws?.type,
    userWinningsType: model?.userWinnings?.type,
    drawsCount: model?.draws?.type === 'Success' ? model.draws.data?.length ?? 0 : undefined
  });

  const draws = model?.draws;
  const userWinningsData = model?.userWinnings;
  const pendingRewardsCount = model?.pendingRewardsCount ?? 0;
  
  const isLoading = useMemo(
    () => draws?.type === 'Loading' || draws?.type === 'NotAsked',
    [draws?.type]
  );
  
  const hasError = useMemo(
    () => draws?.type === 'Failure',
    [draws?.type]
  );
  
  const hasData = useMemo(
    () => draws?.type === 'Success' && Array.isArray(draws.data) && draws.data.length > 0,
    [draws?.type, draws?.data]
  );
  
  const drawsCount = useMemo(
    () => draws?.type === 'Success' ? (draws.data?.length ?? 0) : 0,
    [draws?.type, draws?.data]
  );
  
  const userWinnings = useMemo<WinningBet[]>(
    () => userWinningsData?.type === 'Success' ? userWinningsData.data : [],
    [userWinningsData]
  );

  log.debug(`[WinnersScreen] Derived state`, {
    render: renderCount.current,
    isLoading,
    hasError,
    hasData,
    drawsCount,
    userWinningsLength: userWinnings.length,
    pendingRewardsCount
  });

  // 🔄 MEJORA 2: Skeleton Loading con mensaje informativo
  const renderLoading = () => (
    <View style={styles.contentContainer}>
      <Text category="c1" style={[styles.loadingText, { color: theme.textSecondary }]}>
        Cargando resultados...
      </Text>
      <WinnerCardSkeleton theme={theme} />
      <WinnerCardSkeleton theme={theme} />
      <WinnerCardSkeleton theme={theme} />
    </View>
  );

  // ❌ MEJORA 1: Mensaje de error mejorado
  const renderError = (error: string) => (
    <View style={styles.centered}>
      <Info size={48} color={theme.error} />
      <Text category="h6" style={[styles.errorText, { color: theme.error }]}>
        Error al cargar resultados
      </Text>
      <Text category="p2" style={[styles.errorSubtext, { color: theme.textSecondary }]}>
        {error || 'Intenta nuevamente más tarde'}
      </Text>
    </View>
  );

  // 📭 MEJORA 1: Empty state con contexto y acciones
  const renderEmpty = () => (
    <View style={styles.centered}>
      <View style={[styles.iconContainer, { backgroundColor: theme.primaryLight || theme.primary + '20' }]}>
        <Clock size={32} color={theme.primary} />
      </View>
      <Text category="h6" style={styles.emptyTitle}>
        Sin resultados disponibles
      </Text>
      <Text category="p1" appearance="hint" style={styles.emptyDescription}>
        Los sorteos cerrados con números ganadores aparecerán aquí automáticamente
      </Text>
      <View style={[styles.tipBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Trophy size={16} color={theme.textTertiary} style={styles.tipIcon} />
        <Text category="c1" appearance="hint" style={styles.tipText}>
          Tip: Los resultados se actualizan cuando un sorteo es cerrado
        </Text>
      </View>
    </View>
  );

  const renderContent = () => {
    log.debug(`[WinnersScreen] renderContent called`, { render: renderCount.current });
    
    return RemoteData.fold<any, React.ReactNode>({
      notAsked: () => renderLoading(),
      loading: () => renderLoading(),
      failure: (err) => renderError(err),
      success: (data: ExtendedDrawType[]) => (
        <>
          {/* Header con contador */}
          {data.length > 0 && (
            <View style={[styles.statsBar, { borderBottomColor: theme.border }]}>
              <Text category="c1" style={{ color: theme.textSecondary }}>
                {data.length} resultado{data.length !== 1 ? 's' : ''} encontrado{data.length !== 1 ? 's' : ''}
              </Text>
              {pendingRewardsCount > 0 && (
                <Text category="c1" style={{ color: theme.success }}>
                  {pendingRewardsCount} pendiente{pendingRewardsCount !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
          )}
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <WinnerCard draw={item} winnings={userWinnings} />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmpty()}
          />
        </>
      ),
    }, draws);
  };

  log.debug(`[WinnersScreen] Before conditional`, {
    render: renderCount.current,
    hasData,
    hasError,
    isLoading
  });

  // Estado inicial: sin datos, sin error, sin loading
  if (!hasData && !hasError && !isLoading) {
    log.debug(`[WinnersScreen] Rendering empty state`, { render: renderCount.current });
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Trophy size={20} color={theme.primary} />
          <Text category="h5" style={{ color: theme.text, marginLeft: 8 }}>Resultados</Text>
        </View>
        {renderEmpty()}
      </View>
    );
  }

  log.debug(`[WinnersScreen] Rendering content`, { render: renderCount.current });
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Trophy size={20} color={theme.primary} />
        <Text category="h5" style={{ color: theme.text, marginLeft: 8 }}>Resultados</Text>
        {pendingRewardsCount > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.success }]}>
            <Text category="c1" style={{ color: '#FFFFFF', fontSize: 10 }}>
              {pendingRewardsCount}
            </Text>
          </View>
        )}
      </View>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  list: {
    padding: 16,
    flexGrow: 1,
  },
  contentContainer: {
    padding: 16,
    flexGrow: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  errorText: {
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    marginTop: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyDescription: {
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  tipIcon: {
    marginRight: 8,
  },
  tipText: {
    flex: 1,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
});

export default WinnersScreen;
