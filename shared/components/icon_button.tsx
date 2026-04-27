import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, StyleProp, Insets } from 'react-native';

/** Reusable accessible icon button with proper hitSlop for touch targets. */
export interface IconButtonProps {
  onPress?: () => void;
  /** Accessibility label for screen readers (required). */
  accessibilityLabel: string;
  /** Accessibility role hint (default: 'button'). */
  accessibilityRole?: 'button' | 'imagebutton' | 'link';
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  /** Custom hitSlop. Defaults to 8px padding around the element. */
  hitSlop?: Insets;
  /** Visual feedback on press (default: 0.6). */
  activeOpacity?: number;
  /** Whether the button is disabled. */
  disabled?: boolean;
}

const DEFAULT_HIT_SLOP: Insets = { top: 8, bottom: 8, left: 8, right: 8 };

export const IconButton: React.FC<IconButtonProps> = React.memo(
  ({
    onPress,
    accessibilityLabel,
    accessibilityRole = 'button',
    style,
    children,
    hitSlop = DEFAULT_HIT_SLOP,
    activeOpacity = 0.6,
    disabled = false,
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={style}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      hitSlop={hitSlop}
      activeOpacity={activeOpacity}
      disabled={disabled}
    >
      {children}
    </TouchableOpacity>
  ),
);

IconButton.displayName = 'IconButton';

const styles = StyleSheet.create({
  // Future shared styles if needed
});