import { useColorScheme } from 'react-native';
import Colors from '../../constants/colors';

export const useTheme = () => {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    // Define spacing constants consistent with the project's design system
    const spacing = {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        xxl: 32,
    };

    // Map some additional color names that might be expected by components
    const extendedColors = {
        ...colors,
        surface: colors.card, // using card as surface
    };

    return {
        colors: extendedColors,
        spacing,
        isDark: colorScheme === 'dark',
    };
};
