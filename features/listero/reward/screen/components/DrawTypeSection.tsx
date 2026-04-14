import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { Award } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { DrawTypeWithBetTypes } from '@/shared/services/draw/types';
import { PrizeCard } from './PrizeCard';

interface DrawTypeSectionProps {
  drawType: DrawTypeWithBetTypes;
}

export const DrawTypeSection: React.FC<DrawTypeSectionProps> = ({ drawType }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Award size={18} color={theme.primary} />
        <Text category="h6" style={[styles.sectionTitle, { color: theme.text }]}>
          {drawType.name}
        </Text>
        {drawType.code && (
          <Text category="c1" appearance="hint" style={styles.sectionCode}>
            ({drawType.code})
          </Text>
        )}
      </View>
      <View style={styles.betTypesList}>
        {drawType.bet_types.map((betType) => (
          <PrizeCard key={betType.id} betType={betType} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  sectionCode: {
    marginLeft: 4,
  },
  betTypesList: {
    gap: 12,
  },
});
