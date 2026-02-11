import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
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
  // Main Metrics (Top)
  mainMetricsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  mainMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricInfo: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#8F9BB3',
    fontWeight: '500',
    marginBottom: 0,
  },
  metricValue: {
    fontSize: 18,
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
  // Divider
  divider: {
    height: 1,
    backgroundColor: '#F7F9FC',
    marginVertical: 2,
  },
  // Secondary Metrics (Bottom Row)
  secondaryMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  secondaryItem: {
    flex: 1,
    alignItems: 'flex-start',
  },
  secondaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  secondaryLabel: {
    fontSize: 12,
    color: '#8F9BB3',
    fontWeight: '600',
    marginLeft: 4,
  },
  secondaryValue: {
    fontSize: 15,
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