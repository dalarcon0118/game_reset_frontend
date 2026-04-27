/**
 * Color utilities for React Native.
 * RN doesn't support #RRGGBBAA, so we need rgba() for transparency.
 */

/** Convierte hex (#RRGGBB o #RGB) a rgba string. */
export const withAlpha = (hex: string, alpha: number): string => {
  // Handle shorthand (#RGB)
  const fullHex = hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;

  const r = parseInt(fullHex.slice(1, 3), 16);
  const g = parseInt(fullHex.slice(3, 5), 16);
  const b = parseInt(fullHex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};