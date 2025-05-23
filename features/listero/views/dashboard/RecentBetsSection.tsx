import { View, StyleSheet, FlatList } from 'react-native';
import StyledText from '../../../../components/typography/StyledText';
import BetItem from './BetItem';
import { BetType } from '@/types';
import Layout from '@/constants/Layout';

interface RecentBetsSectionProps {
  bets: BetType[];
}

export default function RecentBetsSection({ bets }: RecentBetsSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <StyledText variant="subheading" weight="bold">
          Últimas Apuestas Registradas
        </StyledText>
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