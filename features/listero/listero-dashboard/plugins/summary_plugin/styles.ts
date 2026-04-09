import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2138',
  },
  eyeIcon: {
    padding: 2,
  },
  // Main Metrics (Top)
  mainMetricsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  mainMetricCard: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  mainMetricTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconContainer: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  metricLabel: {
    fontSize: 11,
    color: '#8F9BB3',
    fontWeight: '600',
    marginBottom: 0,
    flexShrink: 1,
  },
  metricValue: {
    fontSize: 21,
    fontWeight: '800',
    color: '#1A2138',
  },
  percentageBadge: {
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
    gap: 6,
  },
  secondaryItem: {
    flex: 1,
    backgroundColor: '#FAFBFF',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 6,
  },
  secondaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  secondaryLabel: {
    fontSize: 11,
    color: '#8F9BB3',
    fontWeight: '600',
    marginLeft: 3,
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
    marginTop: 3,
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2138',
  },
  // State colors
  positiveText: {
    color: '#00D68F',
  },
  negativeText: {
    color: '#FF3D71',
  },
  primaryText: {
    color: '#3366FF',
  },
  centered: {
    padding: 0,
    alignItems: 'center',
  },
  error: {
    color: '#FF3D71',
    textAlign: 'center',
    marginBottom: 16,
  },
});
