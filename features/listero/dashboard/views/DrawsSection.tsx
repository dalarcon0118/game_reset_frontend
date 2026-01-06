import { StyleSheet } from 'react-native';
import { FlatList } from 'react-native';
import { Label, Flex } from '../../../../shared/components';
import DrawItem from './DrawItem';
import { DrawType } from '@/types';
import LayoutConstants from '@/constants/Layout'; // Renamed to avoid conflict

interface DrawsSectionProps {
  draws: DrawType[];
  onDrawPress: (id: string) => void;
}

export default function DrawsSection({ draws, onDrawPress }: DrawsSectionProps) {
  return (
    <Flex style={styles.container}>
      <Flex style={styles.header}>
        <Label type='subheader' style={styles.headerText}>
          Sorteos Próximos / Abiertos
        </Label>
      </Flex>

      <FlatList
        data={draws}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item, index }) => (
          <DrawItem
            draw={item}
            onPress={onDrawPress}
            onRewardsPress={() => {}}
            onBetsListPress={() => {}}
            onCreateBetPress={() => {}}
            index={index}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </Flex>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: LayoutConstants.spacing.xl,
  },
  header: {
    marginBottom: LayoutConstants.spacing.md,
    paddingHorizontal: LayoutConstants.spacing.md,
  },
  headerText: {
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: LayoutConstants.spacing.md,
  },
});