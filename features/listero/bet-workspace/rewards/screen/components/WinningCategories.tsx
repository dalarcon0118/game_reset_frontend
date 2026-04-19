import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, useTheme } from '@ui-kitten/components';
import LayoutConstants from '@/constants/layout';

interface WinningCategoriesProps {
  winningNumber: string;
}

/**
 * 📊 WINNING CATEGORIES
 * Muestra el desglose del número ganador usando tokens de tema.
 */
export const WinningCategories: React.FC<WinningCategoriesProps> = ({ winningNumber }) => {
  const theme = useTheme();

  return (
    <View style={styles.categoriesRow}>
      <Card style={[styles.categoryCard, { borderColor: theme['color-primary-200'] }]}>
        <Text category="c2" appearance="hint" style={styles.categoryLabel}>GANADOR</Text>
        <Text category="h4" style={[styles.categoryValue, { color: theme['color-primary-500'] }]}>
          {winningNumber}
        </Text>
      </Card>
    </View>
  );
};

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
