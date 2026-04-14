import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Award, Info } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRewards } from '../use_rewards';
import { DrawTypeSection } from './components/DrawTypeSection';

export const PrizesScreen: React.FC = () => {
  const colorScheme = useColorScheme() ?? 'light';
  const insets = useSafeAreaInsets();
  const theme = Colors[colorScheme];
  const { status, drawTypes, bankName, error, isLoading, hasError, hasData, fetchRewards } = useRewards();

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  if (isLoading || status === 'NotAsked') {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text category="h5" style={{ color: theme.text }}>Tabla de Premios</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text category="s1" style={[styles.loadingText, { color: theme.textSecondary }]}>
            Cargando premios...
          </Text>
        </View>
      </View>
    );
  }

  if (hasError || error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text category="h5" style={{ color: theme.text }}>Tabla de Premios</Text>
        </View>
        <View style={styles.centered}>
          <Info size={48} color={theme.error} />
          <Text category="h6" style={[styles.errorText, { color: theme.error }]}>
            Error al cargar premios
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={fetchRewards}
          >
            <Text category="p1" style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!hasData || drawTypes.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text category="h5" style={{ color: theme.text }}>Tabla de Premios</Text>
        </View>
        <View style={styles.centered}>
          <Award size={48} color={theme.textTertiary} />
          <Text category="h6" style={styles.emptyText}>
            Sin premios disponibles
          </Text>
          <Text category="p1" appearance="hint" style={styles.emptySubtext}>
            No hay tipos de apuesta configurados para tu estructura
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text category="h5" style={{ color: theme.text }}>Tabla de Premios</Text>
        <Text category="c1" appearance="hint">
          {bankName}
        </Text>
      </View>

      <FlatList
        data={drawTypes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <DrawTypeSection drawType={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text category="p1" appearance="hint">
              No hay sorteos con premios configurados
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  list: {
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
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
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
});

export default PrizesScreen;
