import { Text, TextProps, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';

export type FontWeight = 'regular' | 'medium' | 'bold';
export type FontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
export type FontVariant = 'heading' | 'subheading' | 'body' | 'caption' | 'button';

interface StyledTextProps extends TextProps {
  weight?: FontWeight;
  size?: FontSize;
  variant?: FontVariant;
  color?: string;
  centered?: boolean;
}

export default function StyledText({
  weight = 'regular',
  size = 'md',
  variant = 'body',
  color,
  centered = false,
  style,
  ...props
}: StyledTextProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const fontWeights = {
    regular: '400',
    medium: '500',
    bold: '700',
  };

  const fontSizes = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  };

  const variants = {
    heading: {
      fontSize: fontSizes['2xl'],
      fontWeight: fontWeights.bold,
      color: Colors[colorScheme].text,
    },
    subheading: {
      fontSize: fontSizes.xl,
      fontWeight: fontWeights.medium,
      color: Colors[colorScheme].text,
    },
    body: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.regular,
      color: Colors[colorScheme].text,
    },
    caption: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.regular,
      color: Colors[colorScheme].textSecondary,
    },
    button: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.medium,
      color: Colors[colorScheme].primary,
    },
  };
  
  const textColor = color ? { color } : {};

  return (
    <Text
      style={[
        styles.text,
        variants[variant],
        { fontWeight: fontWeights[weight] as any },
        size !== 'md' && { fontSize: fontSizes[size] },
        textColor,
        centered && styles.centered,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  text: {
    lineHeight: 24,
  },
  centered: {
    textAlign: 'center',
  },
});