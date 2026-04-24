import { useWindowDimensions } from 'react-native';

const STATIC_SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const STATIC_BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

/**
 * useLayoutMetrics
 * Hook reactivo que devuelve dimensiones de pantalla actualizadas.
 * Reacciona a cambios de orientación, split-screen y tamaño de ventana.
 */
export function useLayoutMetrics() {
  const { width, height } = useWindowDimensions();

  return {
    window: { width, height },
    spacing: STATIC_SPACING,
    borderRadius: STATIC_BORDER_RADIUS,
    isSmallDevice: width < 375,
  };
}

/**
 * Valores estáticos para casos donde no se puede usar hooks
 * (ej: fuera de componentes React, StyleSheet.create, etc.)
 * ⚠️ No reaccionan a cambios de orientación.
 */
const fallbackWidth = 375;

export default {
  window: {
    width: fallbackWidth,
    height: 812,
  },
  spacing: STATIC_SPACING,
  borderRadius: STATIC_BORDER_RADIUS,
  isSmallDevice: false,
};
