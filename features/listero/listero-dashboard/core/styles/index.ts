import { StyleSheet } from 'react-native';
import { DRAW_FILTER } from '../core.types';

export const drawsListStyles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
    paddingTop: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222B45',
  },
  drawCount: {
    color: '#8F9BB3',
    fontSize: 12,
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#8F9BB3',
  },
  errorText: {
    color: '#FF3B30',
    fontWeight: '600',
    marginBottom: 4,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#00C48C',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#8F9BB3',
    fontStyle: 'italic',
  },
});

export const filtersStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E9F2',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: '#E4E9F2',
  },
  activeFilterTab: {
    backgroundColor: '#00C48C',
    borderColor: '#00C48C',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8F9BB3',
  },
  activeFilterLabel: {
    color: '#FFFFFF',
  },
});

export const summaryStyles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 16,
    borderWidth: 0,
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  container: {
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2138',
  },
  eyeIcon: {
    padding: 2,
  },
  mainMetricsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  mainMetricCard: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  mainMetricTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  metricLabel: {
    fontSize: 11,
    color: '#8F9BB3',
    fontWeight: '600',
    marginBottom: 0,
    flexShrink: 1,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A2138',
  },
  percentageBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#E8FBF4',
  },
  percentageText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00D68F',
  },
  secondaryMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 0,
    gap: 8,
  },
  secondaryItem: {
    flex: 1,
    backgroundColor: '#FAFBFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  secondaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  secondaryLabel: {
    fontSize: 12,
    color: '#8F9BB3',
    fontWeight: '600',
    marginLeft: 4,
    flexShrink: 1,
  },
  secondaryBadge: {
    marginLeft: 3,
    backgroundColor: '#EEF2FF',
    borderRadius: 5,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  secondaryBadgeText: {
    fontSize: 9,
    color: '#3366FF',
    fontWeight: '700',
  },
  secondaryValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2138',
  },
  positiveText: { color: '#00D68F' },
  negativeText: { color: '#FF3D71' },
  primaryText: { color: '#3366FF' },
  centered: { padding: 0, alignItems: 'center' },
  error: { color: '#FF3D71', textAlign: 'center', marginBottom: 16 },
});

export const DRAW_FILTER_OPTIONS = [
  { label: 'Todos', value: DRAW_FILTER.ALL },
  { label: 'Abierto', value: DRAW_FILTER.OPEN },
  { label: 'Cerrado', value: DRAW_FILTER.CLOSED },
  { label: 'Premiados', value: DRAW_FILTER.REWARDED },
] as const;