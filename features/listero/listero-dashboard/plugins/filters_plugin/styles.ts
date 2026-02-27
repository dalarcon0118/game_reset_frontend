import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
