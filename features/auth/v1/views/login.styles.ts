import { StyleSheet } from 'react-native';
import { COLORS } from '@/shared/components/constants';
import type { LoginMetrics } from '../hooks/use_responsive_login';

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

/**
 * createLoginStyles
 * Factory que genera estilos responsivos basados en las métricas del dispositivo.
 * Se recalcula solo cuando las métricas cambian (via useMemo en el componente).
 */
export const createLoginStyles = (m: LoginMetrics) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: THEME.background,
    },
    headerSection: {
      flexShrink: 0,
      marginTop: m.headerMarginTop,
    },
    scrollSection: {
      flex: 1,
      minHeight: 0,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingVertical: m.contentGap,
    },
    bottomSection: {
      flexShrink: 0,
      paddingBottom: 10,
      alignItems: 'center',
    },
    contentWrapper: {
      width: '100%',
      maxWidth: m.contentMaxWidth,
      alignSelf: 'center',
      alignItems: 'center',
    },
    iconContainer: {
      width: m.iconContainerSize,
      height: m.iconContainerSize,
      borderRadius: m.iconContainerSize / 2,
      backgroundColor: 'rgba(0, 196, 140, 0.1)',
      justifyContent: 'center',
      alignSelf: 'center',
      alignItems: 'center',
    },
    headerInput: {
      marginBottom: 16,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderColor: 'transparent',
    },
    headerButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      gap: 10,
    },
    userBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 8,
    },
    statusContainer: {
      height: 32,
      justifyContent: 'center',
      width: '100%',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    statusText: {
      color: THEME.text,
      fontSize: m.statusFontSize,
    },
    errorText: {
      textAlign: 'center',
      fontWeight: '600',
    },
    dot: {
      width: m.dotSize,
      height: m.dotSize,
      borderRadius: m.dotSize / 2,
      borderWidth: m.dotBorder,
    },
    forgotPin: {
      color: THEME.textSecondary,
      fontSize: m.forgotPinFontSize,
      fontWeight: '500',
    },
    inputContainer: {
      width: m.inputWidth,
      alignItems: 'center',
    },
    keypadContainer: {
      width: '100%',
      maxWidth: m.keypadMaxWidth,
      paddingBottom: 10,
      alignSelf: 'center',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: m.keypadRowPaddingH,
      marginBottom: m.keypadRowGap,
    },
    key: {
      width: m.keySize,
      minWidth: m.keySize,
      height: m.keySize,
      borderRadius: m.keySize / 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    keyText: {
      color: THEME.keypadText,
      fontSize: m.keyFontSize,
      fontWeight: '400',
    },
    keyPlaceholder: {
      minWidth: m.keySize,
      width: m.keySize,
      height: m.keySize,
    },
  });
