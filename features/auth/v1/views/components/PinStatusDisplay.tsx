import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Text } from '@ui-kitten/components';
import { Flex } from '@/shared/components';
import { THEME, styles } from '../login.styles';

interface PinStatusDisplayProps {
  pinLength: number;
  isAuthenticating: boolean;
  error: string | null;
}

export const PinStatusDisplay = ({
  pinLength,
  isAuthenticating,
  error
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
    <Flex vertical align="center" gap={40} style={{ width: '100%' }}>
      <View style={styles.statusContainer}>
        {isAuthenticating ? (
          <ActivityIndicator color={THEME.accent} />
        ) : error ? (
          <Text status="danger" category="p2" style={styles.errorText}>{error}</Text>
        ) : (
          <Text category="p1" style={styles.statusText}>Ingresa el PIN de acceso</Text>
        )}
      </View>

      <Flex vertical={false} gap={24}>
        {[0, 1, 2, 3, 4, 5].map(renderDot)}
      </Flex>
    </Flex>
  );
};
