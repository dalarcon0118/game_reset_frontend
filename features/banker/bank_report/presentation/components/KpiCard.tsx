import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@ui-kitten/components';
import { Card } from '@shared/components/card';
import { COLORS } from '@shared/components/constants';

interface KpiCardProps {
  label: string;
  value: string;
  footer?: React.ReactNode;
  variant?: 'green' | 'blue' | 'default';
}

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, footer, variant = 'default' }) => {
  const valueColor = variant === 'green' ? COLORS.success : variant === 'blue' ? COLORS.primary : COLORS.textDark;

  return (
    <Card style={styles.container} padding={24}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      {footer && <View style={styles.footer}>{footer}</View>}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: COLORS.textLight,
    marginBottom: 16,
  },
  value: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});