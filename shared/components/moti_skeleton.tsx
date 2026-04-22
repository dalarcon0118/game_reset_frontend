import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from 'moti/skeleton';
import { useColorScheme } from 'react-native';

type Radius = 'round' | 'square' | number;

interface MotiSkeletonProps {
  width?: number | string;
  height?: number;
  radius?: Radius;
  colorMode?: 'light' | 'dark';
  children?: React.ReactNode;
  show?: boolean;
}

export const MotiSkeleton: React.FC<MotiSkeletonProps> = ({
  width = '100%',
  height = 20,
  radius = 8,
  colorMode,
  children,
  show,
}) => {
  const systemColorMode = useColorScheme() ?? 'light';
  const effectiveColorMode = colorMode ?? systemColorMode;

  return (
    <Skeleton
      width={width as any}
      height={height}
      radius={radius as any}
      colorMode={effectiveColorMode}
      show={show}
    >
      {children}
    </Skeleton>
  );
};

interface SkeletonGroupProps {
  show: boolean;
  children: React.ReactNode;
}

export const SkeletonGroup: React.FC<SkeletonGroupProps> = ({ show, children }) => {
  return (
    <Skeleton.Group show={show}>
      {children}
    </Skeleton.Group>
  );
};

interface SkeletonCardProps {
  loading: boolean;
  colorMode?: 'light' | 'dark';
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  loading,
  colorMode,
}) => {
  const systemColorMode = useColorScheme() ?? 'light';
  const effectiveColorMode = colorMode ?? systemColorMode;

  return (
    <Skeleton.Group show={loading}>
      <View style={styles.cardContainer}>
        <MotiSkeleton
          height={24}
          width="60%"
          radius={8}
          colorMode={effectiveColorMode}
        />
        <View style={styles.row}>
          <MotiSkeleton
            height={80}
            width="48%"
            radius={8}
            colorMode={effectiveColorMode}
          />
          <MotiSkeleton
            height={80}
            width="48%"
            radius={8}
            colorMode={effectiveColorMode}
          />
        </View>
        <View style={styles.row}>
          <MotiSkeleton
            height={40}
            width="48%"
            radius={8}
            colorMode={effectiveColorMode}
          />
          <MotiSkeleton
            height={40}
            width="48%"
            radius={8}
            colorMode={effectiveColorMode}
          />
        </View>
      </View>
    </Skeleton.Group>
  );
};

interface SlotSkeletonProps {
  height?: number;
  width?: number | string;
  borderRadius?: number;
  colorMode?: 'light' | 'dark';
  noMargin?: boolean;
}

export const SlotSkeleton: React.FC<SlotSkeletonProps> = ({
  height = 120,
  width = '100%',
  borderRadius = 8,
  colorMode,
  noMargin = false,
}) => {
  const systemColorMode = useColorScheme() ?? 'light';
  const effectiveColorMode = colorMode ?? systemColorMode;

  return (
    <MotiSkeleton
      height={height}
      width={width}
      radius={borderRadius}
      colorMode={effectiveColorMode}
    />
  );
};

interface SkeletonLineProps {
  height?: number;
  width?: number | string;
  colorMode?: 'light' | 'dark';
}

export const SkeletonLine: React.FC<SkeletonLineProps> = ({
  height = 16,
  width = '100%',
  colorMode,
}) => {
  const systemColorMode = useColorScheme() ?? 'light';
  const effectiveColorMode = colorMode ?? systemColorMode;

  return (
    <MotiSkeleton
      height={height}
      width={width}
      radius={4}
      colorMode={effectiveColorMode}
    />
  );
};

interface DailySummarySkeletonProps {
  loading: boolean;
  colorMode?: 'light' | 'dark';
}

export const DailySummarySkeleton: React.FC<DailySummarySkeletonProps> = ({
  loading,
  colorMode,
}) => {
  const systemColorMode = useColorScheme() ?? 'light';
  const effectiveColorMode = colorMode ?? systemColorMode;
  const isDark = effectiveColorMode === 'dark';
  const dailyS = getDailyStyles(isDark);

  return (
    <Skeleton.Group show={loading}>
      <View style={dailyS.card}>
        <View style={dailyS.header}>
          <MotiSkeleton height={16} width="40%" radius={4} colorMode={effectiveColorMode} />
          <MotiSkeleton height={22} width={22} radius={4} colorMode={effectiveColorMode} />
        </View>
        <View style={dailyS.mainMetrics}>
          <View style={dailyS.mainMetricCard}>
            <View style={dailyS.mainMetricTopRow}>
              <MotiSkeleton height={26} width={26} radius={8} colorMode={effectiveColorMode} />
              <MotiSkeleton height={11} width="50%" radius={4} colorMode={effectiveColorMode} />
              <MotiSkeleton height={16} width={32} radius={6} colorMode={effectiveColorMode} />
            </View>
            <MotiSkeleton height={21} width="70%" radius={4} colorMode={effectiveColorMode} />
          </View>
          <View style={dailyS.mainMetricCard}>
            <View style={dailyS.mainMetricTopRow}>
              <MotiSkeleton height={26} width={26} radius={8} colorMode={effectiveColorMode} />
              <MotiSkeleton height={11} width="60%" radius={4} colorMode={effectiveColorMode} />
            </View>
            <MotiSkeleton height={21} width="80%" radius={4} colorMode={effectiveColorMode} />
          </View>
        </View>
        <View style={dailyS.secondaryMetrics}>
          <View style={dailyS.secondaryItem}>
            <View style={dailyS.secondaryHeader}>
              <MotiSkeleton height={14} width={14} radius={2} colorMode={effectiveColorMode} />
              <MotiSkeleton height={11} width="60%" radius={4} colorMode={effectiveColorMode} />
            </View>
            <MotiSkeleton height={16} width="80%" radius={4} colorMode={effectiveColorMode} />
          </View>
          <View style={dailyS.secondaryItem}>
            <View style={dailyS.secondaryHeader}>
              <MotiSkeleton height={14} width={14} radius={2} colorMode={effectiveColorMode} />
              <MotiSkeleton height={11} width="70%" radius={4} colorMode={effectiveColorMode} />
            </View>
            <MotiSkeleton height={16} width="60%" radius={4} colorMode={effectiveColorMode} />
          </View>
        </View>
      </View>
    </Skeleton.Group>
  );
};

interface DrawsListSkeletonProps {
  loading: boolean;
  colorMode?: 'light' | 'dark';
  count?: number;
}

export const DrawsListSkeleton: React.FC<DrawsListSkeletonProps> = ({
  loading,
  colorMode,
  count = 3,
}) => {
  const systemColorMode = useColorScheme() ?? 'light';
  const effectiveColorMode = colorMode ?? systemColorMode;
  const isDark = effectiveColorMode === 'dark';
  const drawsS = getDrawsStyles(isDark);

  return (
    <Skeleton.Group show={loading}>
      <View style={drawsS.content}>
        {Array.from({ length: count }).map((_, index) => (
          <View key={index} style={drawsS.drawItemCard}>
            <View style={drawsS.drawHeader}>
              <MotiSkeleton height={18} width="50%" radius={4} colorMode={effectiveColorMode} />
              <MotiSkeleton height={22} width={60} radius={11} colorMode={effectiveColorMode} />
            </View>
            <View style={drawsS.drawTimes}>
              <MotiSkeleton height={14} width="30%" radius={4} colorMode={effectiveColorMode} />
              <MotiSkeleton height={14} width="40%" radius={4} colorMode={effectiveColorMode} />
            </View>
            <View style={drawsS.drawStats}>
              <View style={drawsS.statItem}>
                <MotiSkeleton height={11} width="80%" radius={4} colorMode={effectiveColorMode} />
                <MotiSkeleton height={18} width="90%" radius={4} colorMode={effectiveColorMode} />
              </View>
              <View style={drawsS.statItem}>
                <MotiSkeleton height={11} width="70%" radius={4} colorMode={effectiveColorMode} />
                <MotiSkeleton height={18} width="60%" radius={4} colorMode={effectiveColorMode} />
              </View>
              <View style={drawsS.statItem}>
                <MotiSkeleton height={11} width="60%" radius={4} colorMode={effectiveColorMode} />
                <MotiSkeleton height={18} width="50%" radius={4} colorMode={effectiveColorMode} />
              </View>
            </View>
            <View style={drawsS.actionButtons}>
              <MotiSkeleton height={36} width={80} radius={8} colorMode={effectiveColorMode} />
              <MotiSkeleton height={36} width={80} radius={8} colorMode={effectiveColorMode} />
              <MotiSkeleton height={36} width={36} radius={8} colorMode={effectiveColorMode} />
            </View>
          </View>
        ))}
      </View>
    </Skeleton.Group>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
});

const getDailyStyles = (isDark: boolean) => StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 16,
    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mainMetrics: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  mainMetricCard: {
    flex: 1,
    backgroundColor: isDark ? '#374151' : '#F7F9FC',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  mainMetricTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  secondaryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  secondaryItem: {
    flex: 1,
    backgroundColor: isDark ? '#374151' : '#FAFBFF',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 6,
  },
  secondaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
  },
});

const getDrawsStyles = (isDark: boolean) => StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  drawItemCard: {
    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  drawHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  drawTimes: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  drawStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});