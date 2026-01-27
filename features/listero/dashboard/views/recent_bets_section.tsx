import { View, StyleSheet, FlatList } from 'react-native';
import { Label } from '../../../../shared/components';
import BetItem from './bet_item';
import { BetType } from '@/types';
import Layout from '@/constants/layout';

interface RecentBetsSectionProps {
  bets: BetType[];
}

export default function RecentBetsSection({ bets }: RecentBetsSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Label type="subheader">
          Últimas Apuestas Registradas
        </Label>
      </View>

      <FlatList
        data={bets}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <BetItem bet={item} index={index} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.xl,
  },
  header: {
    marginBottom: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.md,
  },
  listContent: {
    paddingHorizontal: Layout.spacing.md,
  },
});