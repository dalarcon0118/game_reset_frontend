import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trophy, Info } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useWinnings } from '../use_winnings';
import { WinnerCard } from './components/WinnerCard';

export const WinnersScreen: React.FC = () => {
  const colorScheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const theme = Colors[colorScheme];
  const { status, draws, error, isLoading, hasError, hasData, fetchWinnings } = useWinnings();

  useEffect(() => {
    fetchWinnings();
  }, [fetchWinnings]);

  if (isLoading || status === 'NotAsked') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Trophy size={20} color={theme.primary} />
          <Text category="h5" style={{ color: theme.text, marginLeft: 8 }}>Resultados</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  if (hasError || error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Trophy size={20} color={theme.primary} />
          <Text category="h5" style={{ color: theme.text, marginLeft: 8 }}>Resultados</Text>
        </View>
        <View style={styles.centered}>
          <Info size={48} color={theme.error} />
          <Text category="h6" style={[styles.errorText, { color: theme.error }]}>
            Error al cargar resultados
          </Text>
        </View>
      </View>
    );
  }

  if (!hasData || draws.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Trophy size={20} color={theme.primary} />
          <Text category="h5" style={{ color: theme.text, marginLeft: 8 }}>Resultados</Text>
        </View>
        <View style={styles.centered}>
          <Trophy size={48} color={theme.textTertiary} />
          <Text category="h6" style={styles.emptyText}>
            Sin resultados disponibles
          </Text>
          <Text category="p1" appearance="hint" style={styles.emptySubtext}>
            No hay sorteos con números ganadores
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Trophy size={20} color={theme.primary} />
        <Text category="h5" style={{ color: theme.text, marginLeft: 8 }}>Resultados</Text>
      </View>

      <FlatList
        data={draws}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <WinnerCard draw={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text category="p1" appearance="hint">
              No hay sorteos con números ganadores
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  list: {
    padding: 16,
    flexGrow: 1,
  },
  errorText: {
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  empty: {
    padding: 32,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});

export default WinnersScreen;
