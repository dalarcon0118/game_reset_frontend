import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from '@ui-kitten/components';
import LayoutConstants from '@/constants/layout';

interface WinningCategoriesProps {
  winningNumber: string;
}

/**
 * 📊 WINNING CATEGORIES
 * Muestra el desglose del número ganador.
 */
export const WinningCategories: React.FC<WinningCategoriesProps> = ({ winningNumber }) => (
  <View style={styles.categoriesRow}>
    <Card style={styles.categoryCard}>
      <Text category="c2" appearance="hint" style={styles.categoryLabel}>GANADOR</Text>
      <Text category="h4" style={styles.categoryValue}>{winningNumber}</Text>
    </Card>
  </View>
);

const styles = StyleSheet.create({
  categoriesRow: {
    flexDirection: 'row',
    gap: LayoutConstants.spacing.sm,
    marginBottom: LayoutConstants.spacing.lg,
  },
  categoryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: LayoutConstants.spacing.sm,
  },
  categoryLabel: {
    fontWeight: '700',
    marginBottom: 4,
  },
  categoryValue: {
    fontWeight: '900',
  },
});
