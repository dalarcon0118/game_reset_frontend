import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text } from '@ui-kitten/components';
import { GameType, DrawType as Draw } from '@/types';
import { Flex, Label } from '@/shared/components';

interface BetItem {
    gameType: GameType;
    numbers: string;
    amount: number;
}

interface BetSummaryProps {
    draw: Draw | null;
    gameType: GameType | null;
    numbersPlayed: number[] | string;
    amount: number;
    bets?: BetItem[];
}

export const BetSummary: React.FC<BetSummaryProps> = ({
    draw,
    gameType,
    numbersPlayed,
    amount,
    bets = [],
}) => {
    if (!draw) return null;

    // Convert array to string if needed
    const numbersString = Array.isArray(numbersPlayed)
        ? numbersPlayed.map(n => n.toString().padStart(2, '0')).join('')
        : numbersPlayed;

    const formatNumbers = (numbers: string, gameTypeCode: string | null) => {
        if (gameTypeCode === 'parlet' || gameTypeCode === 'fijo') {
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

    const allBets = [...bets];
    if (gameType && numbersString && amount > 0) {
        allBets.push({ gameType, numbers: numbersString, amount });
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

    const totalAmount = allBets.reduce((sum, bet) => sum + bet.amount, 0);
    if (allBets.length === 0) return null;

    return (
        <Card style={styles.card}>
            <View style={styles.cardContent}>
                <Label type="header" value={`Lista actual (${allBets.length})}`} />
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
};

const styles = StyleSheet.create({
    card: { marginTop: 16, marginBottom: 16, borderRadius: 8 },
    cardContent: { padding: 16 },
    row: { marginVertical: 8 },
    numbersText: { fontWeight: 'bold' },
    betItem: { marginVertical: 4, paddingVertical: 4 },
});
