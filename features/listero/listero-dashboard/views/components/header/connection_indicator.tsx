import React from 'react';
import { StyleSheet } from 'react-native';
import { Wifi, WifiOff } from 'lucide-react-native';
import { useTheme } from '@/shared/hooks/use_theme';

interface ConnectionIndicatorProps {
  isOnline?: boolean;
}

export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = React.memo(
  ({ isOnline = true }) => {
    const { colors } = useTheme();

    return isOnline ? (
      <Wifi
        size={12}
        color={colors.success}
        style={styles.icon}
        accessibilityLabel="Conectado"
        accessibilityRole="image"
      />
    ) : (
      <WifiOff
        size={12}
        color={colors.error}
        style={styles.icon}
        accessibilityLabel="Sin conexión"
        accessibilityRole="image"
      />
    );
  },
);

ConnectionIndicator.displayName = 'ConnectionIndicator';

const styles = StyleSheet.create({
  icon: {
    marginLeft: 2,
  },
});

export default ConnectionIndicator;