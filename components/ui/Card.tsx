import { View, StyleSheet, ViewProps } from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming 
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface CardProps extends ViewProps {
  variant?: 'default' | 'outlined' | 'flat';
  elevation?: 'none' | 'low' | 'medium' | 'high';
  animated?: boolean;
}

export default function Card({ 
  variant = 'default',
  elevation = 'low',
  animated = false,
  style, 
  children, 
  ...props 
}: CardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);
  
  useEffect(() => {
    if (animated) {
      opacity.value = withTiming(1, { duration: 400 });
      translateY.value = withTiming(0, { duration: 400 });
    }
  }, [animated, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: animated ? opacity.value : 1,
      transform: [{ translateY: animated ? translateY.value : 0 }],
    };
  });

  const elevationStyles = {
    none: {},
    low: colorScheme === 'light' 
      ? { shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } }
      : { shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
    medium: colorScheme === 'light'
      ? { shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }
      : { shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
    high: colorScheme === 'light'
      ? { shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } }
      : { shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  };

  const variantStyles = {
    default: {
      backgroundColor: Colors[colorScheme].card,
      borderRadius: Layout.borderRadius.md,
      ...elevationStyles[elevation],
    },
    outlined: {
      backgroundColor: Colors[colorScheme].card,
      borderRadius: Layout.borderRadius.md,
      borderWidth: 1,
      borderColor: Colors[colorScheme].border,
    },
    flat: {
      backgroundColor: Colors[colorScheme].backgroundSecondary,
      borderRadius: Layout.borderRadius.md,
    },
  };

  const Container = animated ? Animated.View : View;

  return (
    <Container
      style={[
        styles.card,
        variantStyles[variant],
        animated && animatedStyle,
        style,
      ]}
      {...props}
    >
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Layout.spacing.md,
    shadowColor: '#000',
  },
});