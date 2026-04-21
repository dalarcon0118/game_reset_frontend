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
        gap: 16, // Consistent spacing between cards in a group
    },
    cardContainer: {
        borderRadius: 20, // Slightly more rounded for modern look
        marginBottom: 24, // Increased spacing for better separation
        padding: 24,
        minHeight: 120, // Consistent reference frame - minimum height for all cards
        elevation: 3, // Slightly increased elevation for better depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, // Reduced opacity for less visual noise
        shadowRadius: 12, // Softer shadow
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.04)', // Subtle border for definition
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flex: 1, // Ensure content fills available space
    },
    leftColumn: {
        flex: 1,
        justifyContent: 'center',
    },
    rightColumn: {
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingLeft: 24, // Increased padding for better separation
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16, // Increased spacing for better hierarchy
    },
    iconWrapper: {
        marginRight: 12, // Consistent spacing
        width: 40, // Slightly larger for better proportion
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.02)', // Subtle background for reference frame
    },
    titleText: {
        fontWeight: '800',
        fontSize: 20,
        flex: 1, // Allow title to expand
        marginLeft: 4, // Small spacing after icon
    },
    tagsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        flexWrap: 'wrap',
        marginTop: 8, // Consistent spacing after header
    },
    tagPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8, // Slightly more rounded
        minHeight: 28, // Consistent height for all tags
        justifyContent: 'center',
    },
    tagLabelText: {
        fontWeight: '700',
        fontSize: 12, // Slightly smaller for less visual weight
    },
    multiplierText: {
        fontWeight: '800',
        fontSize: 28,
        letterSpacing: -0.5,
        textAlign: 'right', // Ensure right alignment
    },
    descriptionContainer: {
        marginTop: 16, // Increased spacing for better separation
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.06)', // Subtle border
    },
    descriptionText: {
        fontSize: 14, // Slightly larger for better readability
        lineHeight: 20,
    },
});
