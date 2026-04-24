import { useMemo } from 'react';
import { PixelRatio, useWindowDimensions } from 'react-native';

export type SpacingSize = 'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl';
export type SpacingSide = 'top' | 'bottom' | 'left' | 'right' | 'vertical' | 'horizontal' | 'all';

export interface SpacingConfig {
  type: SpacingSide;
  value: SpacingSize | number;
}

export type SpacingProp = SpacingSize | number | SpacingConfig | SpacingConfig[];

// DPI baseline = iPhone 14 Pro (460 dpi) donde los spacing se ven bien
const BASELINE_DPI = 460;

// Spacing base (en puntos lógicos, no píxeles físicos)
const BASE_SPACING: Record<SpacingSize, number> = {
  xs: 2,
  s: 4,
  m: 8,
  l: 16,
  xl: 24,
  xxl: 32,
};

/**
 * Factor mínimo y máximo de escala para evitar que la UI se vea
 * extremadamente comprimida o gigante en dispositivos fuera de rango.
 */
const MIN_SCALE = 0.85;
const MAX_SCALE = 1.25;

function clampScale(scale: number): number {
  return Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);
}

/**
 * Calcula el factor de escala basado en el DPI del dispositivo.
 * Usa PixelRatio.get() que devuelve la densidad de escala (1x, 2x, 3x, etc.)
 * combinado con el ancho lógico para estimar el DPI real.
 */
function calculateScaleFactor(): number {
  const pixelDensity = PixelRatio.get();
  const fontScale = PixelRatio.getFontScale();

  // Estimación de DPI basada en la densidad de píxeles
  // Un dispositivo con density=3 (iPhone 14 Pro) ~ 460 DPI
  const estimatedDpi = pixelDensity * 160; // 160 es el baseline de Android (mdpi)

  // Ajuste por configuración de tamaño de fuente del sistema
  // Si el usuario tiene fuentes grandes, reducimos ligeramente el spacing
  // para que no se sature la pantalla
  const fontAdjustment = fontScale > 1.2 ? 0.95 : 1.0;

  const rawScale = (estimatedDpi / BASELINE_DPI) * fontAdjustment;

  return clampScale(rawScale);
}

export interface ResponsiveSpacing {
  /** Factor de escala actual (ej: 0.92, 1.0, 1.15) */
  scale: number;
  /** Spacing escalados */
  spacing: Record<SpacingSize, number>;
  /** Función para escalar cualquier valor numérico */
  scaleValue: (value: number) => number;
  /** Función para resolver SpacingProp a número */
  resolveSpacing: (prop: SpacingProp | undefined) => number;
  /** Dimensiones de la ventana */
  width: number;
  height: number;
  /** Tier del dispositivo basado en altura */
  deviceTier: 'compact' | 'standard' | 'large';
  /** Si es dispositivo pequeño (< 375 lógicos de ancho) */
  isSmallDevice: boolean;
}

function resolveDeviceTier(height: number): ResponsiveSpacing['deviceTier'] {
  if (height < 600) return 'compact';
  if (height > 900) return 'large';
  return 'standard';
}

/**
 * useResponsiveSpacing
 * Hook centralizado para obtener spacing escalados según el DPI real del dispositivo.
 * Usa useWindowDimensions para reaccionar a cambios de orientación o split-screen.
 *
 * @example
 * const { spacing, scaleValue } = useResponsiveSpacing();
 * <View style={{ padding: spacing.l, gap: scaleValue(12) }} />
 */
export function useResponsiveSpacing(): ResponsiveSpacing {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const scale = calculateScaleFactor();
    const deviceTier = resolveDeviceTier(height);
    const isSmallDevice = width < 375;

    const spacing: Record<SpacingSize, number> = {
      xs: Math.round(BASE_SPACING.xs * scale),
      s: Math.round(BASE_SPACING.s * scale),
      m: Math.round(BASE_SPACING.m * scale),
      l: Math.round(BASE_SPACING.l * scale),
      xl: Math.round(BASE_SPACING.xl * scale),
      xxl: Math.round(BASE_SPACING.xxl * scale),
    };

    const scaleValue = (value: number): number => {
      return Math.round(value * scale);
    };

    const resolveSpacing = (prop: SpacingProp | undefined): number => {
      if (prop === undefined) return 0;
      if (typeof prop === 'number') return Math.round(prop * scale);
      if (typeof prop === 'string') return spacing[prop];
      if (Array.isArray(prop)) {
        // Si es array, usamos el primer valor como default
        const first = prop[0];
        return typeof first.value === 'number'
          ? Math.round(first.value * scale)
          : spacing[first.value];
      }
      return typeof prop.value === 'number'
        ? Math.round(prop.value * scale)
        : spacing[prop.value];
    };

    return {
      scale,
      spacing,
      scaleValue,
      resolveSpacing,
      width,
      height,
      deviceTier,
      isSmallDevice,
    };
  }, [width, height]);
}

/**
 * Versión estática para casos donde no podemos usar hooks
 * (ej: fuera de componentes React). Usa valores base sin escalar.
 */
export const STATIC_SPACING = BASE_SPACING;
