import { useColorScheme } from 'react-native';
import { useTheme as useKittenTheme } from '@ui-kitten/components';
import Colors from '../../constants/colors';

export const useTheme = () => {
    const colorScheme = useColorScheme() ?? 'light';
    const kittenTheme = useKittenTheme() as Record<string, any>;
    const colors = Colors[colorScheme];

    const spacing = {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        xxl: 32,
    };

    const isDark = colorScheme === 'dark';

    const ui = {
        background: kittenTheme['background-basic-color-1'],
        surface: kittenTheme['background-basic-color-2'],
        surfaceAlt: kittenTheme['background-basic-color-3'],
        text: kittenTheme['text-basic-color'],
        textSecondary: kittenTheme['text-hint-color'],
        border: kittenTheme['color-basic-400'],
        borderLight: kittenTheme['color-basic-300'],
        primary: kittenTheme['color-primary-500'],
        primaryLight: kittenTheme['color-primary-100'],
        primaryDark: kittenTheme['color-primary-600'],
        success: kittenTheme['color-success-500'],
        successLight: kittenTheme['color-success-100'],
        warning: kittenTheme['color-warning-500'],
        warningLight: kittenTheme['color-warning-100'],
        danger: kittenTheme['color-danger-500'],
        dangerLight: kittenTheme['color-danger-100'],
        info: kittenTheme['color-info-500'],
        infoLight: kittenTheme['color-info-100'],
    };

    return {
        colors,
        theme: kittenTheme,
        ui,
        spacing,
        isDark,
    };
};

export type ThemeColors = ReturnType<typeof useTheme>;
