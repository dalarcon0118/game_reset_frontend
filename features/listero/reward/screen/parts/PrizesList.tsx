import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { DrawTypeSection } from '../components/DrawTypeSection';

export const PrizesList = ({ drawTypes, bankName, theme }: { drawTypes: any[]; bankName: string | null; theme: any }) => (
  <View style={styles.container}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  list: {
    padding: 16,
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
});
