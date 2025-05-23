import { StyleSheet } from 'react-native';
import { Layout, Text, List } from '@ui-kitten/components';
import DrawItem from './DrawItem';
import { DrawType } from '@/types';
import LayoutConstants from '@/constants/Layout'; // Renamed to avoid conflict

interface DrawsSectionProps {
  draws: DrawType[];
  onDrawPress: (id: string) => void;
}

export default function DrawsSection({ draws, onDrawPress }: DrawsSectionProps) {
  return (
    <Layout style={styles.container} level='1'>
      <Layout style={styles.header} level='1'>
        <Text category='s1' style={styles.headerText}>
          Sorteos Próximos / Abiertos
        </Text>
      </Layout>
      
      <List
        data={draws}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item, index }) => (
          <DrawItem 
            draw={item} 
            onPress={onDrawPress} 
            index={index} 
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </Layout>
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