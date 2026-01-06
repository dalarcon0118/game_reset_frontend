import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text, Divider } from '@ui-kitten/components';
import { GameType, DrawType as Draw } from '../../../../../types';
import { Flex, Label } from '@/shared/components';

interface BetItem {
  gameType: GameType;
  numbers: string;
  amount: number;
}

interface BetSummaryProps {
  draw: Draw | null;
  gameType: GameType | null;
  numbersPlayed: string;
  amount: number;
  bets?: BetItem[];
}

export default function BetSummary({
  draw,
  gameType,
  numbersPlayed,
  amount,
  bets = [],
}: BetSummaryProps) {
  if (!draw) {
    return null;
  }

  const formatNumbers = (numbers: string, gameTypeCode: string | null) => {
    if (gameTypeCode === 'parlet'  || gameTypeCode === 'fijo') {
      // Format parlet numbers as pairs separated by " - "
      const pairs = [];
      for (let i = 0; i < numbers.length; i += 2) {
        if (i + 1 < numbers.length) {
          pairs.push(numbers.substring(i, i + 2));
        }
      }
      return pairs.join(' - ');
    }
    return numbers;
  };

  // Create a combined list of all bets including current bet if valid
  const allBets = [...bets];
  if (gameType && numbersPlayed && amount > 0) {
    allBets.push({
      gameType,
      numbers: numbersPlayed,
      amount,
    });
  }

  const renderBetItem = ({ item, index }: { item: BetItem; index: number }) => (
    <View key={index} style={styles.betItem}>
      <View style={styles.row}>
        <Text category="s2">{item.gameType.name}:</Text>
        <Text category="p2" style={styles.numbersText}>
          {formatNumbers(item.numbers, item.gameType.code)}
        </Text>
        <Text category="s2" status="primary">${item.amount}</Text>
      </View>
    </View>
  );

  // Calculate total amount of all bets
  const totalAmount = allBets.reduce((sum, bet) => sum + bet.amount, 0);

  // Only render if there are bets to show
  if (allBets.length === 0) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.cardContent}>
        <Label type="header" value={`Lista actual (${allBets.length})`} />

        <Flex justify="between" align="center" style={styles.row}>
          <Label type="subheader" value="Sorteo:" />
          <Label type="default" value={`${draw.source} - ${draw.time}`} />
        </Flex>

        <FlatList
          data={allBets}
          renderItem={renderBetItem}
          keyExtractor={(_, index) => `bet-${index}`}
          scrollEnabled={false}
        />

        <Flex justify="between" align="center" style={styles.row}>
          <Label type="subheader" value="Total:" />
          <Label type="number" value={`$${totalAmount}`} />
        </Flex>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  cardContent: {
    padding: 16,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  divider: {
    marginVertical: 8,
  },
  row: {
    marginVertical: 8,
  },
  numbersText: {
    fontWeight: 'bold',
  },
  betItem: {
    marginVertical: 4,
    paddingVertical: 4,
  },
});
