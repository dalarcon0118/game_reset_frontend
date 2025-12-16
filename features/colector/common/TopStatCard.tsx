import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Text } from '@ui-kitten/components';
import { COLORS } from './constants';
import { Card } from '../../../shared/components/Card';

interface TopStatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const TopStatCard: React.FC<TopStatCardProps> = ({ label, value, icon, style }) => {
  return (
    <Card style={[styles.container, style]} padding={12}>
       <View style={styles.header}>
         <Text style={styles.label}>{label}</Text>
         {icon}
       </View>
       <Text style={styles.value}>{value}</Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '31%',
    // Removed duplicate shadow styles, handled by Card
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark,
  },
});
