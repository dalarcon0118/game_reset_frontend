import { 
  Pressable, 
  StyleSheet, 
  PressableProps, 
  StyleProp, 
  ViewStyle 
} from 'react-native';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import StyledText from '../typography/StyledText';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming 
} from 'react-native-reanimated';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends PressableProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  title: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<ViewStyle>;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  title,
  style,
  textStyle,
  ...props
}: ButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const sizeStyles = {
    sm: {
      paddingVertical: Layout.spacing.xs,
      paddingHorizontal: Layout.spacing.sm,
      borderRadius: Layout.borderRadius.sm,
    },
    md: {
      paddingVertical: Layout.spacing.sm,
      paddingHorizontal: Layout.spacing.md,
      borderRadius: Layout.borderRadius.md,
    },
    lg: {
      paddingVertical: Layout.spacing.md,
      paddingHorizontal: Layout.spacing.lg,
      borderRadius: Layout.borderRadius.md,
    },
    xl: {
      paddingVertical: Layout.spacing.lg,
      paddingHorizontal: Layout.spacing.xl,
      borderRadius: Layout.borderRadius.lg,
    },
  };

  const textSizes: Record<ButtonSize, any> = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
    xl: 'lg',
  };

  const variants = {
    primary: {
      backgroundColor: Colors[colorScheme].primary,
      textColor: '#FFFFFF',
    },
    secondary: {
      backgroundColor: Colors[colorScheme].secondary,
      textColor: '#FFFFFF',
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: Colors[colorScheme].primary,
      textColor: Colors[colorScheme].primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      textColor: Colors[colorScheme].primary,
    },
    destructive: {
      backgroundColor: Colors[colorScheme].error,
      textColor: '#FFFFFF',
    },
  };

  return (
    <Animated.View style={[fullWidth && styles.fullWidth, animatedStyle]}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          sizeStyles[size],
          variants[variant],
          fullWidth && styles.fullWidth,
          pressed && styles.pressed,
          style,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}
      >
        <StyledText
          weight="medium"
          size={textSizes[size]}
          style={[{ color: variants[variant].textColor }, textStyle]}
        >
          {title}
        </StyledText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.9,
  },
});