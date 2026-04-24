import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@ui-kitten/components';
import { Delete } from 'lucide-react-native';
import { THEME } from '../login.styles';
import { LoginMetrics } from '../../hooks/use_responsive_login';

interface NumericKeypadProps {
  onPress: (val: string) => void;
  onDelete: () => void;
  isDisabled: boolean;
  metrics: LoginMetrics;
  styles: any;
}

export const NumericKeypad = React.memo(({
  onPress,
  onDelete,
  isDisabled,
  metrics,
  styles
}: NumericKeypadProps) => {
  const iconColor = isDisabled ? 'rgba(143, 155, 179, 0.5)' : THEME.textSecondary;

  const renderKey = (val: string) => (
    <TouchableOpacity
      style={[styles.key, { opacity: isDisabled ? 0.3 : 1 }]}
      onPress={() => onPress(val)}
      activeOpacity={0.5}
      disabled={isDisabled}
    >
      <Text style={styles.keyText}>{val}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.keypadContainer}>
      <View style={styles.row}>
        {renderKey('1')}
        {renderKey('2')}
        {renderKey('3')}
      </View>
      <View style={styles.row}>
        {renderKey('4')}
        {renderKey('5')}
        {renderKey('6')}
      </View>
      <View style={styles.row}>
        {renderKey('7')}
        {renderKey('8')}
        {renderKey('9')}
      </View>
      <View style={styles.row}>
        <View style={styles.keyPlaceholder} />
        {renderKey('0')}
        <TouchableOpacity
          style={[styles.key, { opacity: isDisabled ? 0.3 : 1 }]}
          onPress={onDelete}
          activeOpacity={0.5}
          disabled={isDisabled}
        >
          <Delete size={metrics.iconSize} color={iconColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
});
