import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

export type DeviceTier = 'compact' | 'standard' | 'large';

export interface LoginMetrics {
  tier: DeviceTier;
  keySize: number;
  dotSize: number;
  dotBorder: number;
  dotGap: number;
  headerMarginTop: number;
  contentMaxWidth: number;
  keypadMaxWidth: number;
  contentGap: number;
  keypadRowGap: number;
  keypadRowPaddingH: number;
  statusFontSize: number;
  keyFontSize: number;
  forgotPinFontSize: number;
  iconSize: number;
  iconContainerSize: number;
  inputWidth: number;
  pinStatusGap: number;
}

const TIER_MAP: Record<DeviceTier, Omit<LoginMetrics, 'tier' | 'headerMarginTop' | 'contentMaxWidth' | 'keypadMaxWidth' | 'inputWidth'>> = {
  compact: {
    keySize: 44,
    dotSize: 10,
    dotBorder: 1.5,
    dotGap: 16,
    contentGap: 10,
    keypadRowGap: 8,
    keypadRowPaddingH: 12,
    statusFontSize: 15,
    keyFontSize: 20,
    forgotPinFontSize: 13,
    iconSize: 26,
    iconContainerSize: 52,
    pinStatusGap: 24,
  },
  standard: {
    keySize: 60,
    dotSize: 12,
    dotBorder: 1.5,
    dotGap: 24,
    contentGap: 15,
    keypadRowGap: 15,
    keypadRowPaddingH: 22,
    statusFontSize: 18,
    keyFontSize: 24,
    forgotPinFontSize: 14,
    iconSize: 32,
    iconContainerSize: 64,
    pinStatusGap: 40,
  },
  large: {
    keySize: 68,
    dotSize: 16,
    dotBorder: 2,
    dotGap: 28,
    contentGap: 20,
    keypadRowGap: 18,
    keypadRowPaddingH: 28,
    statusFontSize: 20,
    keyFontSize: 28,
    forgotPinFontSize: 16,
    iconSize: 36,
    iconContainerSize: 72,
    pinStatusGap: 48,
  },
};

function resolveTier(height: number): DeviceTier {
  if (height < 600) return 'compact';
  if (height > 900) return 'large';
  return 'standard';
}

/**
 * useResponsiveLogin
 * Centraliza todas las métricas responsivas del login screen.
 * Solo re-renderiza cuando las dimensiones reales del dispositivo cambian.
 */
export const useResponsiveLogin = (): LoginMetrics => {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const tier = resolveTier(height);
    const tierValues = TIER_MAP[tier];

    return {
      ...tierValues,
      tier,
      headerMarginTop: Math.max(Math.round(height * 0.06), 24),
      contentMaxWidth: Math.min(Math.round(width * 0.92), 420),
      keypadMaxWidth: Math.min(Math.round(width * 0.85), 380),
      inputWidth: Math.min(Math.round(width * 0.65), 280),
    };
  }, [width, height]);
};
