import { View, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import StyledText from '../../../../components/typography/StyledText';
import Card from '../../../../components/ui/Card';
import Layout from '@/constants/Layout';
import Colors from '@/constants/Colors';
import { Clock3, Ticket } from 'lucide-react-native';
import { BetType } from '@/types';

interface BetItemProps {
  bet: BetType;
  index: number;
}

export default function BetItem({ bet, index }: BetItemProps) {
  const colorScheme = useColorScheme() ?? 'light';
  
  const getTypeColor = () => {
    switch (bet.type) {
      case 'Fijo':
        return Colors[colorScheme].primary;
      case 'Parlet':
        return Colors[colorScheme].warning;
      case 'Corrido':
        return Colors[colorScheme].success;
      default:
        return Colors[colorScheme].textSecondary;
    }
  };

  return (
    <Card style={styles.container} variant="flat" animated={true}>
      <View style={styles.betHeader}>
        <View style={styles.typeContainer}>
          <Ticket size={16} color={getTypeColor()} />
          <StyledText 
            weight="medium" 
            size="sm" 
            style={[styles.betType, { color: getTypeColor() }]}
          >
            {bet.type}
          </StyledText>
        </View>
        
        <StyledText 
          weight="bold" 
          style={styles.amount}
        >
          ${bet.amount.toFixed(2)}
        </StyledText>
      </View>
      
      <View style={styles.betDetails}>
        <StyledText weight="bold" size="lg">
          {bet.numbers}
        </StyledText>
        
        <View style={styles.infoContainer}>
          <StyledText 
            size="sm" 
            color={Colors[colorScheme].textSecondary}
          >
            {bet.draw}
          </StyledText>
          
          <View style={styles.timeContainer}>
            <Clock3 
              size={14} 
              color={Colors[colorScheme].textTertiary} 
            />
            <StyledText 
              size="xs" 
              color={Colors[colorScheme].textTertiary}
              style={styles.timeText}
            >
              {bet.createdAt}
            </StyledText>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.sm,
    padding: Layout.spacing.md,
  },
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.xs,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  betType: {
    marginLeft: 4,
  },
  amount: {
    fontSize: 16,
  },
  betDetails: {},
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Layout.spacing.xs,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    marginLeft: 4,
  },
});