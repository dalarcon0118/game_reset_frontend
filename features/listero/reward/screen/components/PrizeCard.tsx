import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/colors';
import { BetTypeInfo } from '@/shared/services/draw/types';

interface PrizeCardProps {
  betType: BetTypeInfo;
}

export const PrizeCard: React.FC<PrizeCardProps> = ({ betType }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const [expanded, setExpanded] = useState(false);
  const theme = Colors[colorScheme];

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.card }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.betTypeHeader}>
          <View style={[styles.codeBadge, { backgroundColor: theme.primary }]}>
            <Text style={styles.codeText}>{betType.code}</Text>
          </View>
          <View style={styles.betTypeInfo}>
            <Text category="s1" style={{ color: theme.text }}>{betType.name}</Text>
            {betType.description && (
              <Text category="c1" appearance="hint" style={styles.description}>
                {betType.description}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.expandIcon}>
          {expanded ? (
            <ChevronUp size={20} color={theme.text} />
          ) : (
            <ChevronDown size={20} color={theme.text} />
          )}
        </View>
      </View>

      {expanded && (
        <View style={[styles.rewardsContainer, { borderTopColor: theme.border }]}>
          {betType.rewards && betType.rewards.length > 0 ? (
            betType.rewards.map((reward, index) => (
              <View 
                key={index} 
                style={[styles.rewardItem, { backgroundColor: theme.background }]}
              >
                <View style={styles.rewardInfo}>
                  <Text category="p1" style={{ color: theme.text }}>
                    {reward.name}
                  </Text>
                  {reward.category && (
                    <Text category="c1" appearance="hint" style={styles.rewardCategory}>
                      {reward.category}
                    </Text>
                  )}
                </View>
                <View style={[styles.payoutBadge, { backgroundColor: theme.primary + '20' }]}>
                  <Text category="s1" style={{ color: theme.primary, fontWeight: 'bold' }}>
                    {reward.payout}x
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noRewards}>
              <Text category="p2" appearance="hint">
                Sin premios configurados
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  betTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  codeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  betTypeInfo: {
    flex: 1,
  },
  description: {
    marginTop: 2,
  },
  expandIcon: {
    padding: 4,
  },
  rewardsContainer: {
    borderTopWidth: 1,
    padding: 12,
    gap: 8,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardCategory: {
    marginTop: 2,
    textTransform: 'capitalize',
  },
  payoutBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  noRewards: {
    padding: 16,
    alignItems: 'center',
  },
});
