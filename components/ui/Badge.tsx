import { View, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import StyledText from '../typography/StyledText';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  inverted?: boolean;
}

export default function Badge({
  text,
  variant = 'default',
  size = 'md',
  inverted = false,
}: BadgeProps) {
  const colorScheme = useColorScheme() ?? 'light';
  
  const sizeStyles = {
    sm: {
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: Layout.borderRadius.xs,
    },
    md: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: Layout.borderRadius.sm,
    },
    lg: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: Layout.borderRadius.md,
    },
  };

  const textSizes: Record<BadgeSize, any> = {
    sm: 'xs',
    md: 'xs',
    lg: 'sm',
  };

  const variantColors = {
    default: {
      bg: inverted ? Colors[colorScheme].text : Colors[colorScheme].backgroundSecondary,
      text: inverted ? Colors[colorScheme].background : Colors[colorScheme].text,
    },
    success: {
      bg: inverted ? Colors[colorScheme].success : Colors[colorScheme].successLight,
      text: inverted ? '#FFFFFF' : Colors[colorScheme].success,
    },
    warning: {
      bg: inverted ? Colors[colorScheme].warning : Colors[colorScheme].warningLight,
      text: inverted ? '#FFFFFF' : Colors[colorScheme].warning,
    },
    error: {
      bg: inverted ? Colors[colorScheme].error : Colors[colorScheme].errorLight,
      text: inverted ? '#FFFFFF' : Colors[colorScheme].error,
    },
    info: {
      bg: inverted ? Colors[colorScheme].primary : Colors[colorScheme].primaryLight,
      text: inverted ? '#FFFFFF' : Colors[colorScheme].primary,
    },
  };

  return (
    <View
      style={[
        styles.badge,
        sizeStyles[size],
        { backgroundColor: variantColors[variant].bg },
      ]}
    >
      <StyledText
        size={textSizes[size]}
        weight="medium"
        style={{ color: variantColors[variant].text }}
      >
        {text}
      </StyledText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
  },
});