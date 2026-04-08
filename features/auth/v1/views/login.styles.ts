import { StyleSheet } from 'react-native';
import { COLORS } from '@/shared/components/constants';

// Custom dark theme colors for this screen
export const THEME = {
  background: '#141414',
  text: '#FFFFFF',
  textSecondary: '#8F9BB3',
  dotEmpty: '#333333',
  dotFilled: '#FFFFFF',
  keypadText: '#FFFFFF',
  keypadPressed: '#333333',
  accent: COLORS.primary,
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 196, 140, 0.1)',
    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
  },
  headerInput: {
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'transparent'
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8
  },
  statusContainer: {
    height: 32,
    justifyContent: 'center',
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  statusText: {
    color: THEME.text,
    fontSize: 18
  },
  errorText: {
    textAlign: 'center',
    fontWeight: '600'
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  forgotPin: {
    color: THEME.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  keypadContainer: {
    width: '100%',
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    marginBottom: 15,
  },
  key: {
    width: 60,
    minWidth: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    color: THEME.keypadText,
    fontSize: 24,
    fontWeight: '400',
  },
  keyPlaceholder: {
    minWidth: 60,
    width: 60,
    height: 60,
  }
});
