import { View, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { Label, Card } from '../../../../shared/components';
import Layout from '@/constants/layout';
import Colors from '@/constants/colors';
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
    <Card style={styles.container}>
      <View style={styles.betHeader}>
        <View style={styles.typeContainer}>
          <Ticket size={16} color={getTypeColor()} />
          <Label
            type="detail"
            style={[styles.betType, { color: getTypeColor() }]}
          >
            {bet.type}
          </Label>
        </View>

        <Label
          type="header"
          style={styles.amount}
        >
          ${bet.amount.toFixed(2)}
        </Label>
      </View>

      <View style={styles.betDetails}>
        <Label type="number">
          {bet.numbers}
        </Label>

        <View style={styles.infoContainer}>
          <Label
            type="detail"
            style={{ color: Colors[colorScheme].textSecondary }}
          >
            {bet.draw}
          </Label>

          <View style={styles.timeContainer}>
            <Clock3
              size={14}
              color={Colors[colorScheme].textTertiary}
            />
            <Label
              type="detail"
              style={{ color: Colors[colorScheme].textTertiary, ...styles.timeText }}
            >
              {bet.createdAt}
            </Label>
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