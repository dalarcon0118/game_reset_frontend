import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Text } from '@ui-kitten/components';
import { Flex } from '@/shared/components';
import { THEME } from '../login.styles';
import { LoginMetrics } from '../../hooks/use_responsive_login';

interface PinStatusDisplayProps {
  pinLength: number;
  isAuthenticating: boolean;
  error: string | null;
  metrics: LoginMetrics;
  styles: any;
}

export const PinStatusDisplay = React.memo(({
  pinLength,
  isAuthenticating,
  error,
  metrics,
  styles
}: PinStatusDisplayProps) => {
  const renderDot = (index: number) => {
    const isFilled = index < pinLength;
    return (
      <View
        key={index}
        style={[
          styles.dot,
          {
            backgroundColor: isFilled ? THEME.dotFilled : 'transparent',
            borderColor: isFilled ? THEME.dotFilled : THEME.dotEmpty,
          }
        ]}
      />
    );
  };

  return (
    <Flex vertical align="center" gap={metrics.pinStatusGap} style={{ width: '100%' }}>
      <View style={styles.statusContainer}>
        {isAuthenticating ? (
          <ActivityIndicator color={THEME.accent} />
        ) : error ? (
          <Text status="danger" category="p2" style={styles.errorText}>{error}</Text>
        ) : (
          <Text category="p1" style={styles.statusText}>Ingresa el PIN de acceso</Text>
        )}
      </View>

      <Flex vertical={false} gap={metrics.dotGap}>
        {[0, 1, 2, 3, 4, 5].map(renderDot)}
      </Flex>
    </Flex>
  );
});
