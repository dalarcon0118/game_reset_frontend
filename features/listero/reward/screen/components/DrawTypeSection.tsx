import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
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
      <View style={styles.titleRow}>
        <Text style={[styles.mainTitle, { color: theme.text }]}>
          {drawType.name}
        </Text>
        {drawType.code && (
          <View style={styles.tagLabel}>
            <Text style={styles.tagLabelText}>({drawType.code})</Text>
          </View>
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
    marginBottom: 32,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  mainTitle: {
    fontWeight: '900',
    fontSize: 28,
  },
  tagLabel: {
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagLabelText: {
    fontSize: 14,
    color: '#777',
    fontWeight: '700',
  },
  betTypesList: {
    gap: 8,
  },
});
