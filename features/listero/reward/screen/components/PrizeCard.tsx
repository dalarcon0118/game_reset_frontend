import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { Trophy, Star, Award } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { BetTypeInfo } from '@/shared/services/draw/types';

interface PrizeCardProps {
  betType: BetTypeInfo;
}

export const PrizeCard: React.FC<PrizeCardProps> = ({ betType }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // If no rewards, show base bet type info
  if (!betType.rewards || betType.rewards.length === 0) {
    return (
      <View style={[styles.cardContainer, { backgroundColor: theme.card }]}>
        <View style={styles.cardContent}>
            <View style={styles.headerRow}>
                <Award size={28} color={theme.primary} />
                <Text style={[styles.titleText, { color: theme.text }]}>{betType.name}</Text>
            </View>
            <Text style={{color: theme.textSecondary, marginBottom: 8}}>Sin premios configurados</Text>
        </View>
      </View>
    );
  }

  const getIconForReward = (name: string) => {
      const lower = name.toLowerCase();
      if (lower.includes('principal') || lower.includes('jackpot') || lower.includes('mayor')) {
          return <Trophy size={28} color="#D4AF37" />;
      }
      if (lower.includes('centena') || lower.includes('5 dígitos') || lower.includes('cinco')) {
          return <Star size={28} color="#FFD700" fill="#FFD700" />;
      }
      return <Award size={28} color={theme.primary} />;
  };

  return (
    <View style={styles.groupContainer}>
        {betType.rewards.map((reward, index) => {
            const formatPayout = `${reward.payout.toLocaleString('en-US')}x`;
            const isPool = reward.is_pool;
            const poolText = reward.pool_divisor === 'bank' ? 'Pool Banco' : 'Pool';

            return (
                <View key={index} style={[styles.cardContainer, { backgroundColor: theme.card }]}>
                    <View style={styles.cardContent}>
                        <View style={styles.leftColumn}>
                            <View style={styles.headerRow}>
                                <View style={styles.iconWrapper}>
                                    {getIconForReward(reward.name || betType.name)}
                                </View>
                                <Text style={[styles.titleText, { color: theme.text }]}>{reward.name || betType.name}</Text>
                            </View>
                            
                            <View style={styles.tagsContainer}>
                                {isPool ? (
                                    <View style={[styles.tagPill, { backgroundColor: '#FFD700' }]}>
                                        <Text style={[styles.tagLabelText, { color: '#000000' }]}>{poolText}</Text>
                                    </View>
                                ) : (
                                    <View style={[styles.tagPill, { backgroundColor: '#28A745' }]}>
                                        <Text style={[styles.tagLabelText, { color: '#FFFFFF' }]}>[Fijo]</Text>
                                    </View>
                                )}
                                
                                {reward.category && (
                                    <View style={[styles.tagPill, { backgroundColor: '#E0E0E0' }]}>
                                        <Text style={[styles.tagLabelText, { color: '#000000', textTransform: 'capitalize' }]}>{reward.category}</Text>
                                    </View>
                                )}
                            </View>
                            {reward.description && (
                                <View style={styles.descriptionContainer}>
                                    <Text style={[styles.descriptionText, { color: theme.textSecondary }]}>{reward.description}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.rightColumn}>
                            <Text style={[styles.multiplierText, { color: theme.text }]}>{formatPayout}</Text>
                        </View>
                    </View>
                </View>
            );
        })}
    </View>
  );
};

const styles = StyleSheet.create({
    groupContainer: {
        gap: 0,
    },
    cardContainer: {
        borderRadius: 16,
        marginBottom: 16,
        padding: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftColumn: {
        flex: 1,
        justifyContent: 'center',
    },
    rightColumn: {
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingLeft: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconWrapper: {
        marginRight: 10,
        width: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleText: {
        fontWeight: '800',
        fontSize: 20,
    },
    tagsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        flexWrap: 'wrap',
    },
    tagPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    tagLabelText: {
        fontWeight: '700',
        fontSize: 14,
    },
    multiplierText: {
        fontWeight: '800',
        fontSize: 28,
        letterSpacing: -0.5,
    },
    descriptionContainer: {
        marginTop: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    descriptionText: {
        fontSize: 13,
        lineHeight: 18,
    },
});
