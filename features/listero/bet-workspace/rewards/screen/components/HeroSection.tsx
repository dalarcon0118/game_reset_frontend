import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text as UIKittenText } from '@ui-kitten/components';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy } from 'lucide-react-native';
import LayoutConstants from '@/constants/layout';

interface HeroSectionProps {
  winningNumber: string;
}

/**
 * 🏆 HERO SECTION
 * Muestra el número ganador principal con un gradiente llamativo.
 */
export const HeroSection: React.FC<HeroSectionProps> = ({ winningNumber }) => (
  <LinearGradient
    colors={['#FFD700', '#FFA500']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.heroGradient}
  >
    <View style={styles.heroContent}>
      <Trophy size={40} color="#FFFFFF" style={styles.heroIcon} />
      <UIKittenText 
        category="h1" 
        style={styles.heroNumber}
        testID="winning-number-display"
      >
        {winningNumber}
      </UIKittenText>
      <UIKittenText category="s1" style={styles.heroLabel}>
        NÚMERO GANADOR
      </UIKittenText>
    </View>
  </LinearGradient>
);

const styles = StyleSheet.create({
  heroGradient: {
    borderRadius: LayoutConstants.borderRadius.lg,
    padding: 40,
    marginBottom: LayoutConstants.spacing.lg,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroIcon: {
    marginBottom: 12,
  },
  heroNumber: {
    color: '#FFFFFF',
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroLabel: {
    color: '#FFFFFF',
    letterSpacing: 2,
    fontWeight: '700',
    opacity: 0.9,
  },
});
