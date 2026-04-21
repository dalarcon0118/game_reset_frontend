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
      {/* Section Header */}
      <View style={[styles.sectionHeader, { borderBottomColor: theme.border }]}>
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
      </View>

      {/* Cards List */}
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
    marginBottom: 48, // Increased spacing between sections
  },
  sectionHeader: {
    paddingBottom: 16,
    marginBottom: 24,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  mainTitle: {
    fontWeight: '900',
    fontSize: 28,
    letterSpacing: -0.5, // Better typography
  },
  tagLabel: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)', // Use consistent background
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minHeight: 28,
    justifyContent: 'center',
  },
  tagLabelText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    fontWeight: '700',
  },
  betTypesList: {
    gap: 16, // Consistent spacing between cards
  },
});
